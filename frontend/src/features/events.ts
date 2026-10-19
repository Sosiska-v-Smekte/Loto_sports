import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { citiesApi, eventsApi, sportsApi } from "@/api/endpoints";
import type { EventFilters } from "@/api/types";

export const useEvents = (filters: EventFilters) =>
  useQuery({ queryKey: ["events", filters], queryFn: () => eventsApi.search(filters), placeholderData: keepPreviousData });

export const useFeaturedEvent = (city: string) =>
  useQuery({ queryKey: ["events", "featured", city], queryFn: () => eventsApi.featured(city) });

// Справочник городов не меняется во время работы — грузим один раз
export const useCities = () => useQuery({ queryKey: ["cities"], queryFn: citiesApi.list, staleTime: Infinity });

export const useSports = () => useQuery({ queryKey: ["sports"], queryFn: () => sportsApi.list(), staleTime: 60_000 });

export const useEvent = (id: number) =>
  useQuery({ queryKey: ["event", id], queryFn: () => eventsApi.get(id), retry: false });

export const useParticipants = (id: number, enabled = true) =>
  useQuery({ queryKey: ["event", id, "participants"], queryFn: () => eventsApi.participants(id), enabled });

export const useComments = (id: number, enabled = true) =>
  useQuery({ queryKey: ["event", id, "comments"], queryFn: () => eventsApi.comments(id), enabled });
