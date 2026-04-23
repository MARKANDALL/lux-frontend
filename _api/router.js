// _api/router.js
/* eslint-env node */
// Single-entry dispatch router for the backing `/api/router?route=<name>` surface.
//
// Responsibilities:
//   - Look up the handler by `?route=` / `req.query.route`.
//   - For routes in ADMIN_ONLY, enforce the `x-admin-token` header.
//   - Delegate to the handler; handlers own the response shape on success,
//     the router owns the error shape on failure.
//
// Error shape (always): { ok: false, status, error }
// Success shape: handler-defined JSON with `ok: true`.

import migrate from './migrate.js';

export const ADMIN_ONLY = new Set([
  'migrate',
]);

const HANDLERS = {
  migrate,
};

function sendJson(res, status, body) {
  res.statusCode = status;
  if (typeof res.setHeader === 'function') {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
  }
  res.end(JSON.stringify(body));
}

function errorBody(status, message) {
  return { ok: false, status, error: message };
}

function readRoute(req) {
  if (req && req.query && typeof req.query.route === 'string') {
    return req.query.route;
  }
  const raw = req && req.url ? req.url : '';
  try {
    const url = new URL(raw, 'http://localhost');
    return url.searchParams.get('route') || '';
  } catch {
    return '';
  }
}

function readHeader(req, name) {
  if (!req || !req.headers) return '';
  const lower = name.toLowerCase();
  const value = req.headers[lower] ?? req.headers[name];
  if (Array.isArray(value)) return value[0] || '';
  return value || '';
}

export async function handler(req, res) {
  const route = readRoute(req);
  if (!route) {
    return sendJson(res, 400, errorBody(400, 'Missing route'));
  }

  const fn = HANDLERS[route];
  if (!fn) {
    return sendJson(res, 404, errorBody(404, `Unknown route: ${route}`));
  }

  if (ADMIN_ONLY.has(route)) {
    const token = readHeader(req, 'x-admin-token');
    const expected = process.env.ADMIN_TOKEN || '';
    if (!expected || token !== expected) {
      return sendJson(res, 401, errorBody(401, 'Admin token required'));
    }
  }

  try {
    return await fn(req, res);
  } catch (err) {
    const status = (err && err.status) || 500;
    return sendJson(res, status, errorBody(status, (err && err.message) || 'Internal error'));
  }
}

export default handler;
