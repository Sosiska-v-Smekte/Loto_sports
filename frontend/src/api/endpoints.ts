import { api } from "./client";
import type {
  AdminOrganization,
  AppNotification,
  Availability,
  AuthResult,
  Comment,
  DemoAccount,
  EventCreate,
  DemandGroup,
  EventFilters,
  EventStatus,
  Interest,
  InterestInput,
  MyParticipation,
  Organization,
  OrganizationInput,
  OrganizationStatus,
  Participant,
  Participants,
  ProfileInput,
  Sport,
  SportEvent,
  SportLevel,
  User,
  UserPublic,
  UserSport,
  UserStats,
  Venue,
  VenueInput,
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
  centers: () => api.get<Record<string, [number, number]>>("/cities/centers"),
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
  hideParticipation: (id: number) => api.post<void>(`/me/participations/${id}/hide`),
  cancelParticipation: (id: number) => api.delete<void>(`/me/participations/${id}`),
  setSports: (items: { sport_id: number; level: SportLevel }[]) => api.put<UserSport[]>("/me/sports", items),
  events: () => api.get<SportEvent[]>("/me/events"),
  organization: () => api.get<Organization | null>("/me/organization"),
  submitOrganization: (data: OrganizationInput) => api.post<Organization>("/me/organization", data),
  updateProfile: (data: ProfileInput) => api.patch<User>("/me", data),
  setAvatar: (image: string) => api.put<User>("/me/avatar", { image }),
  removeAvatar: () => api.delete<User>("/me/avatar"),
  setOrganizationAvatar: (image: string) => api.put<Organization>("/me/organization/avatar", { image }),
  removeOrganizationAvatar: () => api.delete<Organization>("/me/organization/avatar"),
};

export const organizationsApi = {
  list: (q?: string) => api.get<Organization[]>("/organizations", { q }),
  get: (id: number) => api.get<{ organization: Organization; events: SportEvent[] }>(`/organizations/${id}`),
  join: (id: number) => api.post<Organization>(`/organizations/${id}/join`),
  leave: (id: number) => api.delete<Organization>(`/organizations/${id}/join`),
};

export const usersApi = {
  get: (id: number) =>
    api.get<{ user: UserPublic; events: SportEvent[]; sports: UserSport[]; stats: UserStats }>(`/users/${id}`),
};

export const notificationsApi = {
  list: () => api.get<AppNotification[]>("/notifications"),
  unreadCount: () => api.get<{ count: number }>("/notifications/unread-count"),
  read: (id: number) => api.post<AppNotification>(`/notifications/${id}/read`),
  readAll: () => api.post<void>("/notifications/read-all"),
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

export const venuesApi = {
  list: (city?: string) => api.get<Venue[]>("/venues", { city }),
  create: (data: VenueInput) => api.post<Venue>("/venues", data),
  addZone: (venueId: number, zone: VenueInput["zones"][number]) => api.post<Venue>(`/venues/${venueId}/zones`, zone),
  removeZone: (zoneId: number) => api.delete<Venue>(`/zones/${zoneId}`),
  availability: (zoneId: number, startsAt: string, endsAt: string) =>
    api.get<Availability>(`/zones/${zoneId}/availability`, { starts_at: startsAt, ends_at: endsAt }),
};

export const interestsApi = {
  demand: (city?: string) => api.get<DemandGroup[]>("/interests/demand", { city }),
  mine: () => api.get<Interest[]>("/interests/mine"),
  add: (data: InterestInput) => api.post<Interest[]>("/interests", data),
  remove: (id: number) => api.delete<void>(`/interests/${id}`),
};
