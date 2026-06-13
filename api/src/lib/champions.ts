import type { Env } from '../types';
import { newId, now } from '../lib/id';
import { monthKey, priorMonth } from '../lib/date';
import { sendPush } from '../lib/push';

// Monthly club CHAMPIONS — the member-facing hook of the network tier. Three
// crowns per club per month, derived from completed matches PLAYED AT the club
// (course_name → the club's course) in that calendar month:
//   • won      — most match wins
//   • played   — most completed matches
//   • win_pct  — best win % among members with >= MIN_DECIDED decided matches
//
// Awards are per-category: if one member tops two, they hold both (a sweep is a
// flex — Bryan's call). Live during the month; the month-end cron freezes them
// into club_champions so a crown is a permanent fact.

const MIN_DECIDED = 3; // floor to qualify for the win% crown (1–0 isn't a title)

export type Category = 'won' | 'played' | 'win_pct';

export interface ChampionEntry {
  user_id: string;
  name: string;
  photo_url: string | null;
  value: number;   // wins | matches | win-pct (0..100)
  detail: string;  // '9 wins' | '14 matches' | '82% (11–2)'
  wins: number;
  losses: number;
  ties: number;
  played: number;
}

export interface ChampionsResult {
  club_id: string;
  month: string;             // 'YYYY-MM'
  crowned: boolean;          // true = frozen (past month), false = live leaders
  won: ChampionEntry[];      // [winner, ...runners-up] (up to 3)
  played: ChampionEntry[];
  win_pct: ChampionEntry[];
}

type Tally = { wins: number; losses: number; ties: number; played: number };

// Tally every member's record from completed matches at the club this month.
async function tallyMonth(env: Env, courseName: string, month: string): Promise<Map<string, Tally>> {
  const { results } = await env.DB.prepare(
    `SELECT creator_id, opponent_id, result FROM matches
      WHERE status = 'completed' AND result IS NOT NULL AND opponent_id IS NOT NULL
        AND course_name = ? AND substr(play_date, 1, 7) = ?`
  ).bind(courseName, month).all<{ creator_id: string; opponent_id: string; result: string }>();

  const tally = new Map<string, Tally>();
  const bump = (id: string, k: keyof Tally) => {
    const t = tally.get(id) ?? { wins: 0, losses: 0, ties: 0, played: 0 };
    t[k]++; t.played++;
    tally.set(id, t);
  };
  for (const m of results ?? []) {
    if (m.result === 'tie') { bump(m.creator_id, 'ties'); bump(m.opponent_id, 'ties'); }
    else if (m.result === 'creator_wins') { bump(m.creator_id, 'wins'); bump(m.opponent_id, 'losses'); }
    else if (m.result === 'opponent_wins') { bump(m.opponent_id, 'wins'); bump(m.creator_id, 'losses'); }
  }
  return tally;
}

function pct(t: Tally): number {
  const decided = t.wins + t.losses;
  return decided > 0 ? Math.round((t.wins / decided) * 100) : 0;
}

// Build the ranked entry list for one category from the tally. Each category
// has its own sort + (for win_pct) eligibility floor. Returns up to `limit`
// (winner first), already name/photo-hydrated.
function rankFor(
  category: Category, tally: Map<string, Tally>,
  nameById: Map<string, string>, photoById: Map<string, string | null>, limit = 3
): ChampionEntry[] {
  let ids = [...tally.keys()];
  if (category === 'win_pct') ids = ids.filter((id) => (tally.get(id)!.wins + tally.get(id)!.losses) >= MIN_DECIDED);

  const cmp = (a: string, b: string): number => {
    const ta = tally.get(a)!, tb = tally.get(b)!;
    if (category === 'won') return tb.wins - ta.wins || pct(tb) - pct(ta) || tb.played - ta.played;
    if (category === 'played') return tb.played - ta.played || tb.wins - ta.wins || pct(tb) - pct(ta);
    return pct(tb) - pct(ta) || tb.wins - ta.wins || tb.played - ta.played; // win_pct
  };
  ids.sort((a, b) => cmp(a, b) || a.localeCompare(b)); // id tiebreak = deterministic

  return ids.slice(0, limit).map((id) => {
    const t = tally.get(id)!;
    const p = pct(t);
    const value = category === 'won' ? t.wins : category === 'played' ? t.played : p;
    const detail = category === 'won' ? `${t.wins} ${t.wins === 1 ? 'win' : 'wins'}`
      : category === 'played' ? `${t.played} ${t.played === 1 ? 'match' : 'matches'}`
      : `${p}% (${t.wins}–${t.losses})`;
    return {
      user_id: id, name: nameById.get(id) ?? 'A golfer', photo_url: photoById.get(id) ?? null,
      value, detail, wins: t.wins, losses: t.losses, ties: t.ties, played: t.played,
    };
  });
}

async function hydrateNames(env: Env, ids: string[]): Promise<{ nameById: Map<string, string>; photoById: Map<string, string | null> }> {
  if (ids.length === 0) return { nameById: new Map(), photoById: new Map() };
  const ph = ids.map(() => '?').join(',');
  const { results } = await env.DB.prepare(
    `SELECT id, first_name, last_name, profile_photo_url FROM users WHERE id IN (${ph})`
  ).bind(...ids).all<{ id: string; first_name: string | null; last_name: string | null; profile_photo_url: string | null }>();
  const nameById = new Map((results ?? []).map((u) => [u.id, [u.first_name, u.last_name].filter(Boolean).join(' ').trim() || 'A golfer']));
  const photoById = new Map((results ?? []).map((u) => [u.id, u.profile_photo_url ?? null]));
  return { nameById, photoById };
}

// Live leaders for the CURRENT month (or any month, computed fresh).
export async function computeChampions(env: Env, clubId: string, courseName: string, month: string): Promise<ChampionsResult> {
  const tally = await tallyMonth(env, courseName, month);
  const { nameById, photoById } = await hydrateNames(env, [...tally.keys()]);
  return {
    club_id: clubId, month, crowned: false,
    won: rankFor('won', tally, nameById, photoById),
    played: rankFor('played', tally, nameById, photoById),
    win_pct: rankFor('win_pct', tally, nameById, photoById),
  };
}

// Read FROZEN crowns for a past month. Returns null if that month was never
// crowned (e.g. before this feature shipped) so the caller can fall back.
export async function readCrowned(env: Env, clubId: string, month: string): Promise<ChampionsResult | null> {
  const { results } = await env.DB.prepare(
    `SELECT category, user_id, value, detail FROM club_champions WHERE club_id = ? AND month = ?`
  ).bind(clubId, month).all<{ category: Category; user_id: string; value: number; detail: string | null }>();
  if (!results || results.length === 0) return null;
  const { nameById, photoById } = await hydrateNames(env, results.map((r) => r.user_id));
  const entry = (r: typeof results[number]): ChampionEntry => ({
    user_id: r.user_id, name: nameById.get(r.user_id) ?? 'A golfer', photo_url: photoById.get(r.user_id) ?? null,
    value: r.value, detail: r.detail ?? '', wins: 0, losses: 0, ties: 0, played: 0,
  });
  const pick = (c: Category) => results.filter((r) => r.category === c).map(entry);
  return { club_id: clubId, month, crowned: true, won: pick('won'), played: pick('played'), win_pct: pick('win_pct') };
}

// Month-end cron: freeze the PRIOR month's three crowns for every NETWORK club
// and push each winner. Idempotent — the unique index (club_id, month, category)
// + INSERT OR IGNORE means a re-run can't double-crown or double-notify.
export async function crownPriorMonth(env: Env): Promise<void> {
  const month = priorMonth(monthKey());
  const { results: clubs } = await env.DB.prepare(
    `SELECT cl.id AS club_id, cl.name AS club_name, co.name AS course_name
       FROM clubs cl JOIN courses co ON co.club_id = cl.id
      WHERE cl.status = 'network'`
  ).all<{ club_id: string; club_name: string; course_name: string }>();

  const LABELS: Record<Category, string> = { won: 'Most Wins', played: 'Most Played', win_pct: 'Best Win %' };

  for (const club of clubs ?? []) {
    const res = await computeChampions(env, club.club_id, club.course_name, month);
    for (const cat of ['won', 'played', 'win_pct'] as Category[]) {
      const winner = res[cat][0];
      if (!winner) continue;
      const ins = await env.DB.prepare(
        `INSERT OR IGNORE INTO club_champions (id, club_id, month, category, user_id, value, detail, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(newId(), club.club_id, month, cat, winner.user_id, winner.value, winner.detail, now()).run();
      // Only notify on a fresh crown (changes > 0), so a re-run stays silent.
      if ((ins.meta.changes ?? 0) > 0) {
        await sendPush(env, winner.user_id, `👑 ${LABELS[cat]} — ${club.club_name}`,
          `You were crowned ${club.club_name}'s ${LABELS[cat]} for ${month}. ${winner.detail}.`, {}).catch(() => {});
      }
    }
  }
}
