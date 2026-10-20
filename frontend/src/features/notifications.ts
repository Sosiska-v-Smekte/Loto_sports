import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationsApi } from "@/api/endpoints";
import { useAuth } from "./auth";

const KEY = ["notifications"] as const;

export function useUnreadCount() {
  const { user } = useAuth();
  return useQuery({
    queryKey: [...KEY, "unread"],
    queryFn: notificationsApi.unreadCount,
    enabled: Boolean(user),
    refetchInterval: 30_000,
    select: (data) => data.count,
  });
}

export function useNotifications(enabled = true) {
  const { user } = useAuth();
  return useQuery({ queryKey: [...KEY, "list"], queryFn: notificationsApi.list, enabled: enabled && Boolean(user) });
}

export function useMarkRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notificationsApi.read,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}

export function useMarkAllRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notificationsApi.readAll,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}
