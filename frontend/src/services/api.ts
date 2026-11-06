import type { Project, ProjectFormData, TimeEntry, TimeEntryInput } from '../types';

interface ApiErrorBody {
  title?: string;
  detail?: string;
  errors?: Record<string, string[]>;
}

export class ApiError extends Error {
  public readonly status: number;

  constructor(
    message: string,
    status: number,
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export interface AuthenticatedUser {
  email: string;
}

let refreshInProgress: Promise<boolean> | null = null;

async function getCsrfToken(): Promise<string> {
  const response = await fetch('/api/auth/csrf', { credentials: 'include' });
  if (!response.ok) throw new ApiError('Не вдалося отримати токен захисту запиту.', response.status);
  const result = await response.json() as { requestToken: string };
  return result.requestToken;
}

async function send(path: string, init: RequestInit = {}): Promise<Response> {
  const method = (init.method ?? 'GET').toUpperCase();
  const headers = new Headers(init.headers);
  if (init.body !== undefined) headers.set('Content-Type', 'application/json');
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    headers.set('X-CSRF-TOKEN', await getCsrfToken());
  }

  return fetch(path, { ...init, method, headers, credentials: 'include' });
}

async function sendWithRefresh(path: string, init: RequestInit = {}): Promise<Response> {
  let response = await send(path, init);
  const isAuthEndpoint = path.startsWith('/api/auth/') && path !== '/api/auth/me';
  if (response.status === 401 && !isAuthEndpoint && await refreshSession()) {
    response = await send(path, init);
  }
  return response;
}

function refreshSession(): Promise<boolean> {
  if (!refreshInProgress) {
    refreshInProgress = send('/api/auth/refresh', { method: 'POST' })
      .then((response) => response.ok)
      .finally(() => {
        refreshInProgress = null;
      });
  }

  return refreshInProgress;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await sendWithRefresh(path, init);
  if (response.status === 204) return undefined as T;

  const body = await response.json().catch(() => null) as ApiErrorBody | null;
  if (!response.ok) {
    const validationMessage = body?.errors
      ? Object.values(body.errors).flat().join(' ')
      : undefined;
    throw new ApiError(
      validationMessage || body?.detail || body?.title || 'Не вдалося виконати запит.',
      response.status,
    );
  }

  return body as T;
}

export const authApi = {
  currentUser: async (): Promise<AuthenticatedUser | null> => {
    try {
      return await request<AuthenticatedUser>('/api/auth/me');
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) return null;
      throw error;
    }
  },

  login: (email: string, password: string) =>
    request<AuthenticatedUser>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (email: string, password: string) =>
    request<AuthenticatedUser>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  logout: () => request<void>('/api/auth/logout', { method: 'POST' }),
};

export const projectsApi = {
  list: async () => (await request<ProjectResponse[]>('/api/projects')).map(toProject),

  create: async (data: ProjectFormData) =>
    toProject(await request<ProjectResponse>('/api/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    })),

  update: async (id: string, data: ProjectFormData) =>
    toProject(await request<ProjectResponse>(`/api/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })),

  delete: (id: string) =>
    request<void>(`/api/projects/${id}`, { method: 'DELETE' }),
};

export const timeEntriesApi = {
  list: async () => (await request<TimeEntryResponse[]>('/api/time-entries')).map(toTimeEntry),

  create: (data: TimeEntryInput) =>
    request<TimeEntryResponse>('/api/time-entries', {
      method: 'POST',
      body: JSON.stringify(data),
    }).then(toTimeEntry),

  update: (id: string, data: TimeEntryInput) =>
    request<TimeEntryResponse>(`/api/time-entries/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }).then(toTimeEntry),

  delete: (id: string) =>
    request<void>(`/api/time-entries/${id}`, { method: 'DELETE' }),
};

interface ProjectResponse {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  timeEntriesCount: number;
}

interface TimeEntryResponse extends Omit<TimeEntry, 'description'> {
  description: string | null;
}

function toProject(project: ProjectResponse): Project {
  return { ...project, description: project.description ?? '' };
}

function toTimeEntry(entry: TimeEntryResponse): TimeEntry {
  return { ...entry, description: entry.description ?? '' };
}
