import type { AuthContext } from '../lib/auth';
import type { Env } from '../types';
import { json, error } from '../lib/response';

// GET /players/:id — a public player profile: name, handicap, home course, their
// overall W/L/H record, and the caller's head-to-head record against them.
export async function handlePlayer(auth: AuthContext, env: Env, segments: string[]): Promise<Response> {
  const id = segments[1];
  if (!id) return error('Not found', 404);

  const u = await env.DB.prepare(
    'SELECT id, first_name, last_name, handicap, home_course_id, profile_photo_url FROM users WHERE id = ?'
  ).bind(id).first<Record<string, any>>();
  if (!u) return error('Player not found', 404);

  let home_course: string | null = null;
  if (u.home_course_id) {
    const c = await env.DB.prepare('SELECT name FROM courses WHERE id = ?').bind(u.home_course_id).first<{ name: string }>();
    home_course = c?.name ?? null;
  }

  const { results } = await env.DB.prepare(
    `SELECT creator_id, opponent_id, result, match_progression, course_name, completed_at
       FROM matches
      WHERE status = 'completed' AND result IS NOT NULL AND (creator_id = ? OR opponent_id = ?)
      ORDER BY completed_at DESC`
  ).bind(id, id).all<Record<string, any>>();

  let wins = 0, losses = 0, ties = 0;
  let h2hW = 0, h2hL = 0, h2hT = 0;
  const meIsViewer = id !== auth.userId;
  // The rivalry series: this player's completed matches vs the VIEWER, newest
  // first — outcome from the viewer's perspective ('win' = you beat them).
  type SeriesRow = { outcome: 'win' | 'loss' | 'tie'; final_delta: string | null; course_name: string; completed_at: string | null };
  const series: SeriesRow[] = [];
  for (const m of results ?? []) {
    const amCreator = m.creator_id === id;
    const outcome = m.result === 'tie' ? 'tie' : (m.result === 'creator_wins') === amCreator ? 'win' : 'loss';
    if (outcome === 'win') wins++; else if (outcome === 'loss') losses++; else ties++;
    // Head-to-head from the VIEWER's perspective (so "you beat them N times").
    if (meIsViewer && (m.creator_id === auth.userId || m.opponent_id === auth.userId)) {
      const mine: SeriesRow['outcome'] = outcome === 'win' ? 'loss' : outcome === 'loss' ? 'win' : 'tie';
      if (mine === 'win') h2hW++; else if (mine === 'loss') h2hL++; else h2hT++;
      let final_delta: string | null = null;
      try { final_delta = m.match_progression ? JSON.parse(m.match_progression).final_delta ?? null : null; } catch { /* ignore */ }
      if (series.length < 5) {
        series.push({ outcome: mine, final_delta, course_name: m.course_name, completed_at: m.completed_at ?? null });
      }
    }
  }
  const played = wins + losses + ties;
  const decided = wins + losses;

  return json({
    user_id: id,
    name: [u.first_name, u.last_name].filter(Boolean).join(' ').trim() || 'A golfer',
    handicap: u.handicap,
    photo_url: u.profile_photo_url ?? null,
    home_course,
    wins, losses, ties, played,
    win_pct: decided > 0 ? Math.round((wins / decided) * 100) : 0,
    head_to_head: { wins: h2hW, losses: h2hL, ties: h2hT },
    // Rivalry extras: recent results vs the viewer (newest first) + the most
    // recent one called out ("Last: 2 & 1 at Prairie Highlands").
    series,
    last_match: series[0] ?? null,
    is_me: id === auth.userId,
  });
}
