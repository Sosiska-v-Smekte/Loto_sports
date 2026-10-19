import { useMutation, useQueryClient } from "@tanstack/react-query";
import { errorMessage } from "@/api/client";
import { toast } from "@/components/ui/Toast";

/**
 * Обёртка над мутацией: после успеха показывает тост и обновляет все данные.
 * Почти любое действие меняет сразу несколько экранов (ленту, карточку, «Мои активности»),
 * поэтому проще и надёжнее перезапросить всё, чем вручную помнить связи.
 */
export function useAction<TArgs, TResult>(
  fn: (args: TArgs) => Promise<TResult>,
  successMessage: string | ((result: TResult) => string),
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: async (result) => {
      toast.success(typeof successMessage === "function" ? successMessage(result) : successMessage);
      await queryClient.invalidateQueries();
    },
    onError: (error) => {
      toast.error(errorMessage(error));
      void queryClient.invalidateQueries();
    },
  });
}
