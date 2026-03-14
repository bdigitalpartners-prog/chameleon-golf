import { useQueryClient } from "@tanstack/react-query";
import {
  useCreateCourse as useGeneratedCreateCourse,
  useCreateRound as useGeneratedCreateRound,
  useDeleteRound as useGeneratedDeleteRound,
  useSaveScores as useGeneratedSaveScores,
  getGetCoursesQueryKey,
  getGetRoundsQueryKey,
  getGetRoundQueryKey,
  type CreateCourse,
  type CreateRound,
  type SaveScoresBody
} from "@workspace/api-client-react";

export function useCreateCourse() {
  const queryClient = useQueryClient();
  return useGeneratedCreateCourse({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCoursesQueryKey() });
      },
    },
  });
}

export function useCreateRound() {
  const queryClient = useQueryClient();
  return useGeneratedCreateRound({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetRoundsQueryKey() });
      },
    },
  });
}

export function useDeleteRound() {
  const queryClient = useQueryClient();
  return useGeneratedDeleteRound({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetRoundsQueryKey() });
      },
    },
  });
}

export function useSaveScores(roundId: number) {
  const queryClient = useQueryClient();
  return useGeneratedSaveScores({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetRoundsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetRoundQueryKey(roundId) });
      },
    },
  });
}
