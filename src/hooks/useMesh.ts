import { useQuery } from "@tanstack/react-query";
import {fetchMeshSummary } from '../api/revApi';

export function useMesh() {
    return useQuery({
        queryKey: ["mesh"],
        queryFn: fetchMeshSummary,
    });
}