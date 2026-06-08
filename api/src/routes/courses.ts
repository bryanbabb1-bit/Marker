import type { AuthContext } from '../lib/auth';
import type { Env } from '../types';
import { json, error } from '../lib/response';

// Read-only course catalog (build-order: feeds the create-match course picker).
//   GET /courses        list courses
//   GET /courses/:id    course with its tees and each tee's 18 holes
export async function handleCourses(
  request: Request,
  _auth: AuthContext,
  env: Env,
  segments: string[]
): Promise<Response> {
  if (request.method !== 'GET') return error('Method not allowed', 405);
  const id = segments[1];

  if (!id) {
    const { results } = await env.DB.prepare(
      'SELECT id, name, city, state FROM courses ORDER BY name'
    ).all();
    return json({ courses: results });
  }

  const course = await env.DB.prepare('SELECT * FROM courses WHERE id = ?').bind(id).first();
  if (!course) return error('Course not found', 404);

  const tees = await env.DB.prepare(
    'SELECT * FROM tees WHERE course_id = ? ORDER BY course_rating DESC'
  ).bind(id).all();

  const teesWithHoles = await Promise.all(
    (tees.results as any[]).map(async (tee) => {
      const holes = await env.DB.prepare(
        'SELECT hole_number, par, stroke_index FROM holes WHERE tee_id = ? ORDER BY hole_number'
      ).bind(tee.id).all();
      return { ...tee, holes: holes.results };
    })
  );

  return json({ course, tees: teesWithHoles });
}
