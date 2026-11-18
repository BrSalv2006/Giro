import xss from 'xss';

export function sanitizeText(value) {
  return typeof value === 'string' ? xss(value, { whiteList: {}, stripIgnoreTag: true, stripIgnoreTagBody: ['script'] }).trim() : value;
}

export function sanitizeBody(body) {
  if (!body || typeof body !== 'object') return body;
  return Object.fromEntries(Object.entries(body).map(([key, value]) => [key, Array.isArray(value) ? value.map(sanitizeText) : sanitizeText(value)]));
}
