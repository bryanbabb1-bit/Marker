import type { AuthContext } from '../lib/auth';
import type { Env } from '../types';
import { json, error } from '../lib/response';
import { newId, now } from '../lib/id';

// Clubs — the network layer (strategy doc A2/A4).
//   GET  /clubs/:id           club summary + member demand count (claim screen)
//   POST /clubs/:id/interest  record the caller's "I want my club in" signal
//
// Interest is one row per member per club (INSERT OR IGNORE on a unique index),
// so the count is people, not taps. No DELETE: a member who dismisses the card
// hides it locally; their demand signal stays — it's the sales pipeline.
export async function handleClubs(
  request: Request,
  auth: AuthContext,
  env: Env,
  segments: string[]
): Promise<Response> {
  const method = request.method;
  const clubId = segments[1];
  const action = segments[2];
  if (!clubId) return error('Not found', 404);

  // Explicit columns ONLY — this projection is the sole guard keeping
  // contact_email/contact_name (the GM's details) off the member-facing wire.
  // Never widen to SELECT *.
  const club = await env.DB.prepare(
    'SELECT id, name, status, crest_url, primary_color FROM clubs WHERE id = ?'
  ).bind(clubId).first<Record<string, unknown>>();
  if (!club) return error('Club not found', 404);

  if (!action && method === 'GET') {
    const n = await env.DB.prepare('SELECT COUNT(*) AS n FROM club_interest WHERE club_id = ?')
      .bind(clubId).first<{ n: number }>();
    return json({ ...club, interest_count: n?.n ?? 0 });
  }

  if (action === 'interest' && method === 'POST') {
    // Signaling for a club that's already in the network is a no-op success —
    // the card shouldn't render there, but a stale client may still send it.
    if (club.status === 'network') {
      const n = await env.DB.prepare('SELECT COUNT(*) AS n FROM club_interest WHERE club_id = ?')
        .bind(clubId).first<{ n: number }>();
      return json({ recorded: false, count: n?.n ?? 0 });
    }
    const res = await env.DB.prepare(
      'INSERT OR IGNORE INTO club_interest (id, club_id, user_id, created_at) VALUES (?, ?, ?, ?)'
    ).bind(newId(), clubId, auth.userId, now()).run();
    const n = await env.DB.prepare('SELECT COUNT(*) AS n FROM club_interest WHERE club_id = ?')
      .bind(clubId).first<{ n: number }>();
    return json({ recorded: (res.meta.changes ?? 0) > 0, count: n?.n ?? 0 });
  }

  return error('Not found', 404);
}
