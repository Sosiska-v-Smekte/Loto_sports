import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { organizationsApi, usersApi } from "@/api/endpoints";

export const useOrganizations = (q: string) =>
  useQuery({ queryKey: ["organizations", q], queryFn: () => organizationsApi.list(q), placeholderData: keepPreviousData });

export const useOrganization = (id: number) =>
  useQuery({ queryKey: ["organization", id], queryFn: () => organizationsApi.get(id), retry: false });

export const useUserPage = (id: number) =>
  useQuery({ queryKey: ["user", id], queryFn: () => usersApi.get(id), retry: false });
