import { api } from "./client";
import type {
  AdminOrganization,
  AuthResult,
  Comment,
  DemoAccount,
  EventCreate,
  EventFilters,
  EventStatus,
  MyParticipation,
  Organization,
  OrganizationInput,
  OrganizationStatus,
  Participant,
  Participants,
  ProfileInput,
  Sport,
  SportEvent,
  User,
  UserPublic,
} from "./types";

export const authApi = {
  login: (email: string, password: string) => api.post<AuthResult>("/auth/login", { email, password }),
  register: (data: { name: string; email: string; password: string; city: string }) =>
    api.post<AuthResult>("/auth/register", data),
  logout: () => api.post<void>("/auth/logout"),
  me: () => api.get<User>("/auth/me"),
  demoAccounts: () => api.get<DemoAccount[]>("/auth/demo-accounts"),
};

export const citiesApi = {
  list: () => api.get<string[]>("/cities"),
};

export const sportsApi = {
  list: (q?: string) => api.get<Sport[]>("/sports", { q }),
};

export const eventsApi = {
  search: (filters: EventFilters) => api.get<SportEvent[]>("/events", { ...filters }),
  featured: (city?: string) => api.get<SportEvent | null>("/events/featured", { city }),
  get: (id: number) => api.get<SportEvent>(`/events/${id}`),
  create: (data: EventCreate) => api.post<SportEvent>("/events", data),
  join: (id: number) => api.post<Participant>(`/events/${id}/join`),
  participants: (id: number) => api.get<Participants>(`/events/${id}/participants`),
  approve: (participationId: number) => api.post<Participant>(`/participations/${participationId}/approve`),
  reject: (participationId: number) => api.post<Participant>(`/participations/${participationId}/reject`),
  comments: (id: number) => api.get<Comment[]>(`/events/${id}/comments`),
  addComment: (id: number, text: string, parentId: number | null = null) =>
    api.post<Comment>(`/events/${id}/comments`, { text, parent_id: parentId }),
};

export const meApi = {
  participations: () => api.get<MyParticipation[]>("/me/participations"),
  events: () => api.get<SportEvent[]>("/me/events"),
  organization: () => api.get<Organization | null>("/me/organization"),
  submitOrganization: (data: OrganizationInput) => api.post<Organization>("/me/organization", data),
  updateProfile: (data: ProfileInput) => api.patch<User>("/me", data),
};

export const organizationsApi = {
  list: (q?: string) => api.get<Organization[]>("/organizations", { q }),
  get: (id: number) => api.get<{ organization: Organization; events: SportEvent[] }>(`/organizations/${id}`),
};

export const usersApi = {
  get: (id: number) => api.get<{ user: UserPublic; events: SportEvent[] }>(`/users/${id}`),
};

export const adminApi = {
  organizations: (status?: OrganizationStatus, q?: string) =>
    api.get<AdminOrganization[]>("/admin/organizations", { status, q }),
  approveOrganization: (id: number) => api.post<Organization>(`/admin/organizations/${id}/approve`),
  rejectOrganization: (id: number, reason: string) =>
    api.post<Organization>(`/admin/organizations/${id}/reject`, { reason }),
  events: (filters: { status?: EventStatus; q?: string; organization_id?: number; organizer_id?: number }) =>
    api.get<SportEvent[]>("/admin/events", filters),
  unpublishEvent: (id: number, reason: string) => api.post<SportEvent>(`/admin/events/${id}/unpublish`, { reason }),
  deleteEvent: (id: number, reason: string) => api.post<SportEvent>(`/admin/events/${id}/delete`, { reason }),
  hideComment: (id: number, reason: string) => api.post<Comment>(`/admin/comments/${id}/hide`, { reason }),
};
