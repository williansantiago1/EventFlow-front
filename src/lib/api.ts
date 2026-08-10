// In dev, always hit the Vite proxy (same origin) to avoid CORS when the
// page is opened as 127.0.0.1 vs localhost while VITE_API_URL points at :3001.
const API_URL = import.meta.env.DEV
  ? ""
  : String(import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit & { json?: unknown } = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.json !== undefined) {
    headers.set("content-type", "application/json");
  }
  const token = localStorage.getItem("ef_access");
  if (token) {
    headers.set("authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
    credentials: "include",
    body: init.json !== undefined ? JSON.stringify(init.json) : init.body,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const data = (await response.json().catch(() => ({}))) as {
    error?: { code?: string; message?: string };
    accessToken?: string;
  };

  if (data.accessToken) {
    localStorage.setItem("ef_access", data.accessToken);
  }

  if (!response.ok) {
    throw new ApiError(
      response.status,
      data.error?.code ?? "INTERNAL_ERROR",
      data.error?.message ?? "Falha na requisição.",
    );
  }

  return data as T;
}
