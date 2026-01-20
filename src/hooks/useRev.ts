import { useQuery } from "@tanstack/react-query";
import { fetchRevById } from "../api/revApi";

export function useRev(id: string | null) {
    return useQuery({
        queryKey: ["rev", id],
        queryFn: () => {
            if (!id) throw new Error("No ID");
            return fetchRevById(id);
        },
        enabled: !!id,
    });
}