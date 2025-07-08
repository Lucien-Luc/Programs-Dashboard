import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { programsApi, activitiesApi } from "@/lib/api";
import type { Program, InsertProgram, Activity, InsertActivity } from "@shared/schema";

export function usePrograms() {
  return useQuery<Program[]>({
    queryKey: ["programs"],
    queryFn: () => programsApi.getAll(),
  });
}

export function useProgram(id: string) {
  return useQuery<Program>({
    queryKey: ["programs", id],
    queryFn: () => programsApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateProgram() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (program: InsertProgram) => {
      return programsApi.create(program);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["programs"] });
    },
  });
}

export function useUpdateProgram() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, program }: { id: string; program: Partial<InsertProgram> }) => {
      return programsApi.update(id, program);
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["programs"] });
      queryClient.invalidateQueries({ queryKey: ["programs", id] });
    },
  });
}

export function useDeleteProgram() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      return programsApi.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["programs"] });
    },
  });
}

export function useActivities() {
  return useQuery<Activity[]>({
    queryKey: ["activities"],
    queryFn: () => activitiesApi.getAll(),
  });
}

export function useProgramActivities(programId: string) {
  return useQuery<Activity[]>({
    queryKey: ["activities", "program", programId],
    queryFn: () => activitiesApi.getByProgram(programId),
    enabled: !!programId,
  });
}

export function useCreateActivity() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (activity: InsertActivity) => {
      return activitiesApi.create(activity);
    },
    onSuccess: (_, activity) => {
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      if (activity.programId) {
        queryClient.invalidateQueries({ queryKey: ["activities", "program", activity.programId] });
      }
    },
  });
}