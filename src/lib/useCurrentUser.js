import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export function useCurrentUser() {
  return useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const { data, error } = await supabase.auth.getUser();

      if (error) {
        throw error;
      }

      return data?.user ?? null;
    },
    staleTime: 60 * 1000,
  });
}