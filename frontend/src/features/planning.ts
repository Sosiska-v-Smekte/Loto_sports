import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { interestsApi, venuesApi } from "@/api/endpoints";

export const useVenues = (city?: string, enabled = true) =>
  useQuery({ queryKey: ["venues", city ?? null], queryFn: () => venuesApi.list(city), enabled });

/** Занята ли зона в выбранное время. Запрос идёт, только когда время задано целиком. */
export const useAvailability = (zoneId: number | null, startsAt: string | null, endsAt: string | null) =>
  useQuery({
    queryKey: ["availability", zoneId, startsAt, endsAt],
    queryFn: () => venuesApi.availability(zoneId as number, startsAt as string, endsAt as string),
    enabled: zoneId !== null && startsAt !== null && endsAt !== null,
    placeholderData: keepPreviousData,
  });

export const useDemand = (city?: string, enabled = true) =>
  useQuery({ queryKey: ["interests", "demand", city ?? null], queryFn: () => interestsApi.demand(city), enabled });

export const useMyInterests = (enabled = true) =>
  useQuery({ queryKey: ["interests", "mine"], queryFn: interestsApi.mine, enabled });
