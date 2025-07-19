// Utility functions for auth and order requests to your Vercel server

const BASE_URL = 'https://your-vercel-app.vercel.app/api'; // <-- change to your deployed Vercel URL

export async function registerUser(username: string, password: string) {
  const res = await fetch(`${BASE_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  return res.json();
}

export async function loginUser(username: string, password: string) {
  const res = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  return res.json();
}

export async function submitOrder(username: string, items: any[], total: number) {
  const res = await fetch(`${BASE_URL}/order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, items, total })
  });
  return res.json();
}
