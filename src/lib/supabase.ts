export type AuthSession = {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user: { id: string; email?: string; user_metadata?: { display_name?: string } };
};

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
const storageKey = "blackout-supabase-session";

async function request(path: string, init: RequestInit = {}, accessToken?: string) {
  const response = await fetch(`${url}${path}`, {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${accessToken ?? key}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) throw new Error(data?.msg ?? data?.message ?? data?.error_description ?? "Something went wrong.");
  return data;
}

function saveSession(data: Omit<AuthSession, "expires_at"> & { expires_in: number }) {
  const session: AuthSession = { ...data, expires_at: Math.floor(Date.now() / 1000) + data.expires_in };
  window.localStorage.setItem(storageKey, JSON.stringify(session));
  return session;
}

export async function signUp(email: string, password: string, displayName: string) {
  return request("/auth/v1/signup", { method: "POST", body: JSON.stringify({ email, password, data: { display_name: displayName } }) });
}

export async function signIn(email: string, password: string) {
  const data = await request("/auth/v1/token?grant_type=password", { method: "POST", body: JSON.stringify({ email, password }) });
  return saveSession(data);
}

export async function getSession() {
  const stored = window.localStorage.getItem(storageKey);
  if (!stored) return null;
  const session = JSON.parse(stored) as AuthSession;
  if (session.expires_at > Math.floor(Date.now() / 1000) + 60) return session;
  try {
    const data = await request("/auth/v1/token?grant_type=refresh_token", { method: "POST", body: JSON.stringify({ refresh_token: session.refresh_token }) });
    return saveSession(data);
  } catch {
    window.localStorage.removeItem(storageKey);
    return null;
  }
}

export async function signOut(session: AuthSession) {
  try { await request("/auth/v1/logout", { method: "POST" }, session.access_token); } finally { window.localStorage.removeItem(storageKey); }
}

export async function db<T>(path: string, session: AuthSession, init: RequestInit = {}) {
  return request(`/rest/v1/${path}`, init, session.access_token) as Promise<T>;
}
