import type { AuthContext } from '../lib/auth';
import type { Env } from '../types';
import { json, error } from '../lib/response';

// GET /players/:id — a public player profile: name, handicap, home course, their
// overall W/L/H record, and the caller's head-to-head record against them.
export async function handlePlayer(auth: AuthContext, env: Env, segments: string[]): Promise<Response> {
  const id = segments[1];
  if (!id) return error('Not found', 404);

  const u = await env.DB.prepare(
    'SELECT id, first_name, last_name, handicap, home_course_id FROM users WHERE id = ?'
  ).bind(id).first<Record<string, any>>();
  if (!u) return error('Player not found', 404);

  let home_course: string | null = null;
  if (u.home_course_id) {
    const c = await env.DB.prepare('SELECT name FROM courses WHERE id = ?').bind(u.home_course_id).first<{ name: string }>();
    home_course = c?.name ?? null;
  }

  const { results } = await env.DB.prepare(
    `SELECT creator_id, opponent_id, result FROM matches
      WHERE status = 'completed' AND result IS NOT NULL AND (creator_id = ? OR opponent_id = ?)`
  ).bind(id, id).all<{ creator_id: string; opponent_id: string | null; result: string }>();

  let wins = 0, losses = 0, ties = 0;
  let h2hW = 0, h2hL = 0, h2hT = 0;
  const meIsViewer = id !== auth.userId;
  for (const m of results ?? []) {
    const amCreator = m.creator_id === id;
    const outcome = m.result === 'tie' ? 'tie' : (m.result === 'creator_wins') === amCreator ? 'win' : 'loss';
    if (outcome === 'win') wins++; else if (outcome === 'loss') losses++; else ties++;
    // Head-to-head from the VIEWER's perspective (so "you beat them N times").
    if (meIsViewer && (m.creator_id === auth.userId || m.opponent_id === auth.userId)) {
      if (outcome === 'win') h2hL++;       // they won → you lost
      else if (outcome === 'loss') h2hW++; // they lost → you won
      else h2hT++;
    }
  }
  const played = wins + losses + ties;
  const decided = wins + losses;

  return json({
    user_id: id,
    name: [u.first_name, u.last_name].filter(Boolean).join(' ').trim() || 'A golfer',
    handicap: u.handicap,
    home_course,
    wins, losses, ties, played,
    win_pct: decided > 0 ? Math.round((wins / decided) * 100) : 0,
    head_to_head: { wins: h2hW, losses: h2hL, ties: h2hT },
    is_me: id === auth.userId,
  });
}
