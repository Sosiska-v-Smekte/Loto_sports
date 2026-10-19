import { useQuery } from "@tanstack/react-query";
import { meApi } from "@/api/endpoints";

export const useMyParticipations = () =>
  useQuery({ queryKey: ["my", "participations"], queryFn: meApi.participations });

export const useMyEvents = () => useQuery({ queryKey: ["my", "events"], queryFn: meApi.events });

export const useMyOrganization = (enabled = true) =>
  useQuery({ queryKey: ["my", "organization"], queryFn: meApi.organization, enabled });
