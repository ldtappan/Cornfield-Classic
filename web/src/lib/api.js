const API = import.meta.env.VITE_API_BASE || 'http://localhost:8080';

export async function api(path, opts={}) {
  const res = await fetch(API + path, { headers: { 'content-type': 'application/json', ...(opts.headers||{}) }, ...opts });
  if (!res.ok) throw new Error((await res.json().catch(()=>({}))).error || res.statusText);
  return res.json();
}
