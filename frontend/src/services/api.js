const API = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export async function api(path, options = {}, token) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  let body;
  try {
    body = await response.json();
  } catch {
    throw new Error('Invalid response from the server.');
  }
  if (!response.ok) {
    const details = Array.isArray(body.errors) ? body.errors.map((item) => item.message).join(', ') : '';
    const error = new Error(details ? `${body.message}: ${details}` : body.message || 'Request failed');
    error.status = response.status;
    throw error;
  }
  return body.data;
}
