import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { adminApi } from "@/api/endpoints";
import type { EventStatus, OrganizationStatus } from "@/api/types";

export const useAdminOrganizations = (status: OrganizationStatus | undefined, q: string) =>
  useQuery({
    queryKey: ["admin", "organizations", status, q],
    queryFn: () => adminApi.organizations(status, q),
    placeholderData: keepPreviousData,
  });

export interface AdminEventFilters {
  status?: EventStatus;
  q?: string;
  organization_id?: number;
  organizer_id?: number;
}

export const useAdminEvents = (filters: AdminEventFilters) =>
  useQuery({
    queryKey: ["admin", "events", filters],
    queryFn: () => adminApi.events(filters),
    placeholderData: keepPreviousData,
  });
