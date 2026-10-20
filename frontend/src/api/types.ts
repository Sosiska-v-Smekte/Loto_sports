export type Level = "any" | "beginner" | "amateur" | "pro";
export type JoinMode = "open" | "approval";
export type EventStatus = "published" | "unpublished" | "deleted";
export type ParticipationStatus = "confirmed" | "pending" | "rejected";
export type OrganizationStatus = "pending" | "approved" | "rejected";

export interface UserBrief {
  id: number;
  name: string;
  avatar_url: string | null;
}

export interface OrganizationBrief {
  id: number;
  name: string;
  status: OrganizationStatus;
}

export interface User extends UserBrief {
  email: string;
  city: string | null;
  about: string | null;
  is_admin: boolean;
  organization: OrganizationBrief | null;
}

export interface UserPublic extends UserBrief {
  city: string | null;
  about: string | null;
  organization: OrganizationBrief | null;
}

export interface Sport {
  id: number;
  name: string;
  slug: string | null;
  color: string;
  icon: string;
  is_custom: boolean;
}

export interface SportEvent {
  id: number;
  title: string;
  description: string;
  sport: Sport;
  organizer: UserBrief;
  organization: OrganizationBrief | null;
  starts_at: string;
  ends_at: string | null;
  city: string;
  address: string;
  place_details: string;
  /** Зона площадки, к которой привязано мероприятие */
  zone: EventZone | null;
  latitude: number | null;
  longitude: number | null;
  level: Level;
  requirements: string;
  join_mode: JoinMode;
  card_color: string | null;
  /** Гравировка шапки карточки, id из CARD_PATTERNS */
  card_pattern: string | null;
  status: EventStatus;
  moderation_reason: string | null;
  created_at: string;
  participants_count: number;
  pending_count: number | null;
  my_participation: { id: number; status: ParticipationStatus } | null;
  can_manage: boolean;
  is_past: boolean;
}

export interface EventZone {
  id: number;
  name: string;
  group_name: string | null;
  capacity: number;
  venue_id: number;
  venue_name: string;
}

export interface Zone {
  id: number;
  name: string;
  group_name: string | null;
  capacity: number;
  buffer_minutes: number;
}

export interface Venue {
  id: number;
  name: string;
  city: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  organization_id: number | null;
  can_manage: boolean;
  zones: Zone[];
}

export interface VenueInput {
  name: string;
  city: string;
  address: string;
  zones: { name: string; group_name?: string | null; capacity: number; buffer_minutes: number }[];
}

export interface Availability {
  free: boolean;
  message: string | null;
  suggestion: { starts_at: string; ends_at: string } | null;
  busy: { starts_at: string; ends_at: string; title: string }[];
}

export type DayKind = "weekday" | "weekend";
export type DayPart = "morning" | "day" | "evening";

export interface Interest {
  id: number;
  sport: Sport;
  city: string;
  district: string;
  day_kind: DayKind;
  day_part: DayPart;
}

export interface InterestInput {
  sport_id: number;
  city: string;
  district: string;
  day_kinds: DayKind[];
  day_parts: DayPart[];
}

export interface DemandGroup {
  sport: Sport;
  city: string;
  day_kind: DayKind;
  day_part: DayPart;
  count: number;
  mine: boolean;
  districts: string[];
}

export interface EventCreate {
  zone_id?: number | null;
  title: string;
  description: string;
  sport_id: number | null;
  sport_name: string | null;
  starts_at: string;
  ends_at: string | null;
  city: string;
  address: string;
  place_details: string;
  latitude?: number | null;
  longitude?: number | null;
  level: Level;
  requirements: string;
  join_mode: JoinMode;
  card_color: string | null;
  /** Гравировка шапки карточки, id из CARD_PATTERNS */
  card_pattern: string | null;
  organization_id: number | null;
}

export interface Participant {
  id: number;
  status: ParticipationStatus;
  created_at: string;
  decided_at: string | null;
  user: UserBrief;
}

export interface Participants {
  confirmed: Participant[];
  pending: Participant[];
  rejected: Participant[];
}

export interface MyParticipation {
  id: number;
  status: ParticipationStatus;
  created_at: string;
  decided_at: string | null;
  event: SportEvent;
}

export interface Comment {
  id: number;
  author: UserBrief;
  text: string | null;
  is_hidden: boolean;
  hidden_reason: string | null;
  is_organizer_reply: boolean;
  created_at: string;
  parent_id: number | null;
  root_id: number;
  reply_to: { id: number; author_name: string; excerpt: string | null } | null;
}

export interface Organization {
  id: number;
  owner: UserBrief;
  name: string;
  description: string;
  sports: string;
  city: string;
  contacts: string;
  avatar_url: string | null;
  status: OrganizationStatus;
  rejection_reason: string | null;
  created_at: string;
  reviewed_at: string | null;
}

export interface AdminOrganization extends Organization {
  owner_email: string;
  events_count: number;
}

export interface OrganizationInput {
  name: string;
  description: string;
  sports: string;
  city: string;
  contacts: string;
}

export type NotificationType =
  | "reminder"
  | "reply"
  | "participation_decision"
  | "organization_review"
  | "organization_request"
  | "event_unpublished"
  | "interest_invite";

export interface AppNotification {
  id: number;
  type: NotificationType;
  title: string;
  body: string;
  link: string;
  is_read: boolean;
  created_at: string;
}

export interface ProfileInput {
  name: string;
  city: string;
  about: string;
}

export interface DemoAccount {
  email: string;
  password: string;
  name: string;
  role: string;
  description: string;
}

export interface AuthResult {
  token: string;
  user: User;
}

export interface EventFilters {
  q?: string;
  city?: string;
  date?: string;
  sport_id?: number;
}
