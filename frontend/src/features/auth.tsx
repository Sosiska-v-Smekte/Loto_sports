import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { tokenStorage } from "@/api/client";
import { authApi } from "@/api/endpoints";
import type { AuthResult, User } from "@/api/types";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  signIn: (result: AuthResult) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const ME_KEY = ["me"] as const;

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [token, setToken] = useState(tokenStorage.get);

  const me = useQuery({
    queryKey: ME_KEY,
    queryFn: async () => {
      try {
        return await authApi.me();
      } catch {
        // Токен устарел: выходим молча
        tokenStorage.set(null);
        setToken(null);
        return null;
      }
    },
    enabled: Boolean(token),
    staleTime: Infinity,
  });

  const signIn = useCallback(
    (result: AuthResult) => {
      tokenStorage.set(result.token);
      setToken(result.token);
      // Данные зависят от того, кто смотрит (статусы записи, права), поэтому сбрасываем кэш
      queryClient.removeQueries();
      queryClient.setQueryData(ME_KEY, result.user);
    },
    [queryClient],
  );

  const signOut = useCallback(async () => {
    await authApi.logout().catch(() => undefined);
    tokenStorage.set(null);
    setToken(null);
    queryClient.removeQueries();
  }, [queryClient]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: token ? (me.data ?? null) : null,
      isLoading: Boolean(token) && me.isPending,
      signIn,
      signOut,
    }),
    [token, me.data, me.isPending, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth вызван вне AuthProvider");
  return context;
}
