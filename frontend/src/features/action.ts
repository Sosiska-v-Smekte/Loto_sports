import { useMutation, useQueryClient } from "@tanstack/react-query";
import { errorMessage } from "@/api/client";
import { toast } from "@/components/ui/Toast";

/** После успеха показывает тост и инвалидирует все запросы: действие обычно меняет несколько экранов. */
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
