import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useBackendActor } from './useBackendActor';
import type {
  Animal,
  Meal,
  AnimalId,
  MealId,
  BulkSnakeEntry,
  AnimalWithDaysSinceLastMeal,
  AnimalWithDaysSinceLastMealAndPairing,
  AnimalWithDaysSinceLastEvents,
  UserProfile,
  Time,
  AnimalWeightUpdate,
  WeightEntry,
  WeightId,
  PairingEntry,
  PairingId,
  ShedEntry,
  ShedId,
  TubChangeEntry,
  TubChangeId,
  ExternalBlob,
  IdNumber,
  UserRole,
  ClutchEntry,
} from '../backend';

// Advanced infrastructure tier: Enhanced retry configuration
const RETRY_CONFIG = {
  retry: 3,
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 10000),
};

// Advanced infrastructure tier: Extended stale times for better caching
const STALE_TIME_SHORT = 1000 * 60 * 5; // 5 minutes
const STALE_TIME_MEDIUM = 1000 * 60 * 15; // 15 minutes
const STALE_TIME_LONG = 1000 * 60 * 30; // 30 minutes

export function useGetCallerUserRole() {
  const { actor, isFetching: actorFetching } = useBackendActor();

  const query = useQuery<UserRole>({
    queryKey: ['currentUserRole'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      try {
        return await actor.getCallerUserRole();
      } catch (error) {
        console.error('[Query] Error fetching user role:', error);
        throw error;
      }
    },
    enabled: !!actor && !actorFetching,
    ...RETRY_CONFIG,
    staleTime: STALE_TIME_LONG,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useInitializeAccessControl() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.initializeAccessControl();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserRole'] });
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      queryClient.invalidateQueries({ queryKey: ['animals'] });
      queryClient.invalidateQueries({ queryKey: ['animalsWithDays'] });
      queryClient.invalidateQueries({ queryKey: ['animalsWithDaysAndPairings'] });
      queryClient.invalidateQueries({ queryKey: ['animalsWithEvents'] });
    },
    retry: 2,
    retryDelay: 1000,
  });
}

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useBackendActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      try {
        return await actor.getCallerUserProfile();
      } catch (error) {
        console.error('[Query] Error fetching user profile:', error);
        throw error;
      }
    },
    enabled: !!actor && !actorFetching,
    ...RETRY_CONFIG,
    staleTime: STALE_TIME_LONG,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
    retry: 2,
    retryDelay: 1000,
  });
}

export function useGetCustomHeading() {
  const { actor, isFetching } = useBackendActor();

  return useQuery<string>({
    queryKey: ['customHeading'],
    queryFn: async () => {
      if (!actor) return 'Animal Activity Log';
      try {
        return await actor.getCustomHeading();
      } catch (error) {
        console.error('[Query] Error fetching custom heading:', error);
        return 'Animal Activity Log';
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: STALE_TIME_LONG,
  });
}

export function useSetCustomHeading() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (heading: string) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.setCustomHeading(heading);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customHeading'] });
    },
    retry: 2,
    retryDelay: 1000,
  });
}

export function useGetLastWaterChange() {
  const { actor, isFetching } = useBackendActor();

  return useQuery<Time | null>({
    queryKey: ['lastWaterChange'],
    queryFn: async () => {
      if (!actor) return null;
      try {
        return await actor.getLastWaterChange();
      } catch (error) {
        console.error('[Query] Error fetching last water change:', error);
        return null;
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: STALE_TIME_SHORT,
  });
}

export function useUpdateWaterChange() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.updateWaterChange();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lastWaterChange'] });
    },
    retry: 2,
    retryDelay: 1000,
  });
}

export function useGetAnimals() {
  const { actor, isFetching } = useBackendActor();

  return useQuery<Animal[]>({
    queryKey: ['animals'],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getAnimals();
      } catch (error) {
        console.error('[Query] Error fetching animals:', error);
        return [];
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: STALE_TIME_MEDIUM,
  });
}

export function useAddAnimal() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      name,
      genes,
      sex,
      birthday,
      weight,
      picture,
      idNumber,
    }: {
      name: string;
      genes: string;
      sex: string;
      birthday: Time | null;
      weight: bigint | null;
      picture: ExternalBlob | null;
      idNumber: IdNumber;
    }) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.addAnimal(name, genes, sex, birthday, weight, picture, idNumber);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['animals'] });
      queryClient.invalidateQueries({ queryKey: ['animalsWithDays'] });
      queryClient.invalidateQueries({ queryKey: ['animalsWithDaysAndPairings'] });
      queryClient.invalidateQueries({ queryKey: ['animalsWithEvents'] });
    },
    retry: 2,
    retryDelay: 1000,
  });
}

export function useAddBulkSnakes() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (snakes: BulkSnakeEntry[]) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.addBulkSnakes(snakes);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['animals'] });
      queryClient.invalidateQueries({ queryKey: ['animalsWithDays'] });
      queryClient.invalidateQueries({ queryKey: ['animalsWithDaysAndPairings'] });
      queryClient.invalidateQueries({ queryKey: ['animalsWithEvents'] });
    },
    retry: 2,
    retryDelay: 1000,
  });
}

export function useEditAnimal() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      name,
      genes,
      sex,
      birthday,
      weight,
      picture,
      idNumber,
    }: {
      id: AnimalId;
      name: string;
      genes: string;
      sex: string;
      birthday: Time | null;
      weight: bigint | null;
      picture: ExternalBlob | null;
      idNumber: IdNumber;
    }) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.editAnimal(id, name, genes, sex, birthday, weight, picture, idNumber);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['animals'] });
      queryClient.invalidateQueries({ queryKey: ['animalsWithDays'] });
      queryClient.invalidateQueries({ queryKey: ['animalsWithDaysAndPairings'] });
      queryClient.invalidateQueries({ queryKey: ['animalsWithEvents'] });
    },
    retry: 2,
    retryDelay: 1000,
  });
}

export function useDeleteAnimal() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: AnimalId) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.deleteAnimal(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['animals'] });
      queryClient.invalidateQueries({ queryKey: ['animalsWithDays'] });
      queryClient.invalidateQueries({ queryKey: ['animalsWithDaysAndPairings'] });
      queryClient.invalidateQueries({ queryKey: ['animalsWithEvents'] });
    },
    retry: 2,
    retryDelay: 1000,
  });
}

export function useGetMealsForAnimal(animalId: AnimalId) {
  const { actor, isFetching } = useBackendActor();

  return useQuery<Meal[]>({
    queryKey: ['meals', animalId],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getMealsForAnimal(animalId);
      } catch (error) {
        console.error('[Query] Error fetching meals:', error);
        return [];
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: STALE_TIME_SHORT,
  });
}

export function useAddMeal() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      animalId,
      details,
      timestamp,
    }: {
      animalId: AnimalId;
      details: string;
      timestamp: Time;
    }) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.addMeal(animalId, details, timestamp);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['meals', variables.animalId] });
      queryClient.invalidateQueries({ queryKey: ['animalsWithDays'] });
      queryClient.invalidateQueries({ queryKey: ['animalsWithDaysAndPairings'] });
      queryClient.invalidateQueries({ queryKey: ['animalsWithEvents'] });
    },
    retry: 2,
    retryDelay: 1000,
  });
}

export function useAddBulkMeals() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      animalIds,
      details,
      timestamp,
    }: {
      animalIds: AnimalId[];
      details: string;
      timestamp: Time;
    }) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.addBulkMealsForSelectedAnimals(animalIds, details, timestamp);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meals'] });
      queryClient.invalidateQueries({ queryKey: ['animalsWithDays'] });
      queryClient.invalidateQueries({ queryKey: ['animalsWithDaysAndPairings'] });
      queryClient.invalidateQueries({ queryKey: ['animalsWithEvents'] });
    },
    retry: 2,
    retryDelay: 1000,
  });
}

// Alias for backward compatibility
export const useAddBulkMealsForSelectedAnimals = useAddBulkMeals;

export function useEditMeal() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, details }: { id: MealId; details: string }) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.editMeal(id, details);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meals'] });
    },
    retry: 2,
    retryDelay: 1000,
  });
}

export function useDeleteMeal() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: MealId) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.deleteMeal(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meals'] });
      queryClient.invalidateQueries({ queryKey: ['animalsWithDays'] });
      queryClient.invalidateQueries({ queryKey: ['animalsWithDaysAndPairings'] });
      queryClient.invalidateQueries({ queryKey: ['animalsWithEvents'] });
    },
    retry: 2,
    retryDelay: 1000,
  });
}

export function useGetAnimalsWithDaysSinceLastMeal() {
  const { actor, isFetching } = useBackendActor();

  return useQuery<AnimalWithDaysSinceLastMeal[]>({
    queryKey: ['animalsWithDays'],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getAnimalsWithDaysSinceLastMeal();
      } catch (error) {
        console.error('[Query] Error fetching animals with days:', error);
        return [];
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: STALE_TIME_SHORT,
  });
}

export function useGetAnimalsWithDaysSinceLastMealAndPairing() {
  const { actor, isFetching } = useBackendActor();

  return useQuery<AnimalWithDaysSinceLastMealAndPairing[]>({
    queryKey: ['animalsWithDaysAndPairings'],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getAnimalsWithDaysSinceLastMealAndPairing();
      } catch (error) {
        console.error('[Query] Error fetching animals with days and pairings:', error);
        return [];
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: STALE_TIME_SHORT,
  });
}

export function useGetAnimalsWithDaysSinceLastEvents() {
  const { actor, isFetching } = useBackendActor();

  return useQuery<AnimalWithDaysSinceLastEvents[]>({
    queryKey: ['animalsWithEvents'],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getAnimalsWithDaysSinceLastEvents();
      } catch (error) {
        console.error('[Query] Error fetching animals with events:', error);
        return [];
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: STALE_TIME_SHORT,
  });
}

export function useAddBulkWeights() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (weightUpdates: AnimalWeightUpdate[]) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.addBulkWeightsForSelectedAnimals(weightUpdates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['animals'] });
      queryClient.invalidateQueries({ queryKey: ['weights'] });
      queryClient.invalidateQueries({ queryKey: ['animalsWithDays'] });
      queryClient.invalidateQueries({ queryKey: ['animalsWithDaysAndPairings'] });
      queryClient.invalidateQueries({ queryKey: ['animalsWithEvents'] });
    },
    retry: 2,
    retryDelay: 1000,
  });
}

// Alias for backward compatibility
export const useAddBulkWeightsForSelectedAnimals = useAddBulkWeights;

export function useGetWeightHistoryForAnimal(animalId: AnimalId) {
  const { actor, isFetching } = useBackendActor();

  return useQuery<WeightEntry[]>({
    queryKey: ['weights', animalId],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getWeightHistoryForAnimal(animalId);
      } catch (error) {
        console.error('[Query] Error fetching weight history:', error);
        return [];
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: STALE_TIME_SHORT,
  });
}

export function useAddWeightEntry() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      animalId,
      weight,
      timestamp,
    }: {
      animalId: AnimalId;
      weight: bigint;
      timestamp: Time;
    }) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.addWeightEntry(animalId, weight, timestamp);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['weights', variables.animalId] });
      queryClient.invalidateQueries({ queryKey: ['animals'] });
    },
    retry: 2,
    retryDelay: 1000,
  });
}

export function useEditWeightEntry() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      weight,
      timestamp,
    }: {
      id: WeightId;
      weight: bigint;
      timestamp: Time;
    }) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.editWeightEntry(id, weight, timestamp);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weights'] });
    },
    retry: 2,
    retryDelay: 1000,
  });
}

export function useDeleteWeightEntry() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: WeightId) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.deleteWeightEntry(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weights'] });
    },
    retry: 2,
    retryDelay: 1000,
  });
}

export function useGetPairingHistoryForAnimal(animalId: AnimalId) {
  const { actor, isFetching } = useBackendActor();

  return useQuery<PairingEntry[]>({
    queryKey: ['pairings', animalId],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getPairingHistoryForAnimal(animalId);
      } catch (error) {
        console.error('[Query] Error fetching pairing history:', error);
        return [];
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: STALE_TIME_SHORT,
  });
}

export function useAddPairingEntry() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      animalId,
      timestamp,
      notes,
    }: {
      animalId: AnimalId;
      timestamp: Time;
      notes: string;
    }) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.addPairingEntry(animalId, timestamp, notes);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pairings', variables.animalId] });
      queryClient.invalidateQueries({ queryKey: ['animalsWithDaysAndPairings'] });
      queryClient.invalidateQueries({ queryKey: ['animalsWithEvents'] });
    },
    retry: 2,
    retryDelay: 1000,
  });
}

export function useEditPairingEntry() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      timestamp,
      notes,
    }: {
      id: PairingId;
      timestamp: Time;
      notes: string;
    }) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.editPairingEntry(id, timestamp, notes);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pairings'] });
      queryClient.invalidateQueries({ queryKey: ['animalsWithDaysAndPairings'] });
      queryClient.invalidateQueries({ queryKey: ['animalsWithEvents'] });
    },
    retry: 2,
    retryDelay: 1000,
  });
}

export function useDeletePairingEntry() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: PairingId) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.deletePairingEntry(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pairings'] });
      queryClient.invalidateQueries({ queryKey: ['animalsWithDaysAndPairings'] });
      queryClient.invalidateQueries({ queryKey: ['animalsWithEvents'] });
    },
    retry: 2,
    retryDelay: 1000,
  });
}

export function useUploadUserLogo() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (logo: ExternalBlob) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.uploadUserLogo(logo);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userLogo'] });
    },
    retry: 2,
    retryDelay: 1000,
  });
}

export function useGetUserLogo() {
  const { actor, isFetching } = useBackendActor();

  return useQuery<ExternalBlob | null>({
    queryKey: ['userLogo'],
    queryFn: async () => {
      if (!actor) return null;
      try {
        return await actor.getUserLogo();
      } catch (error) {
        console.error('[Query] Error fetching user logo:', error);
        return null;
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: STALE_TIME_LONG,
  });
}

export function useGetShedHistoryForAnimal(animalId: AnimalId) {
  const { actor, isFetching } = useBackendActor();

  return useQuery<ShedEntry[]>({
    queryKey: ['sheds', animalId],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getShedHistoryForAnimal(animalId);
      } catch (error) {
        console.error('[Query] Error fetching shed history:', error);
        return [];
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: STALE_TIME_SHORT,
  });
}

export function useGetTubChangeHistoryForAnimal(animalId: AnimalId) {
  const { actor, isFetching } = useBackendActor();

  return useQuery<TubChangeEntry[]>({
    queryKey: ['tubChanges', animalId],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getTubChangeHistoryForAnimal(animalId);
      } catch (error) {
        console.error('[Query] Error fetching tub change history:', error);
        return [];
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: STALE_TIME_SHORT,
  });
}

export function useLogShedOnly() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (animalId: AnimalId) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.logShedOnly(animalId);
    },
    onSuccess: (_, animalId) => {
      queryClient.invalidateQueries({ queryKey: ['sheds', animalId] });
      queryClient.invalidateQueries({ queryKey: ['animalsWithEvents'] });
    },
    retry: 2,
    retryDelay: 1000,
  });
}

export function useLogTubChangeOnly() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (animalId: AnimalId) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.logTubChangeOnly(animalId);
    },
    onSuccess: (_, animalId) => {
      queryClient.invalidateQueries({ queryKey: ['tubChanges', animalId] });
      queryClient.invalidateQueries({ queryKey: ['animalsWithEvents'] });
    },
    retry: 2,
    retryDelay: 1000,
  });
}

export function useLogShedAndTubChange() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (animalId: AnimalId) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.logShedAndTubChange(animalId);
    },
    onSuccess: (_, animalId) => {
      queryClient.invalidateQueries({ queryKey: ['sheds', animalId] });
      queryClient.invalidateQueries({ queryKey: ['tubChanges', animalId] });
      queryClient.invalidateQueries({ queryKey: ['animalsWithEvents'] });
    },
    retry: 2,
    retryDelay: 1000,
  });
}

export function useEditShedEntry() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      animalId,
      timestamp,
    }: {
      id: ShedId;
      animalId: AnimalId;
      timestamp: Time;
    }) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.editShedEntry(id, animalId, timestamp);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sheds'] });
      queryClient.invalidateQueries({ queryKey: ['animalsWithEvents'] });
    },
    retry: 2,
    retryDelay: 1000,
  });
}

export function useDeleteShedEntry() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: ShedId) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.deleteShedEntry(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sheds'] });
      queryClient.invalidateQueries({ queryKey: ['animalsWithEvents'] });
    },
    retry: 2,
    retryDelay: 1000,
  });
}

export function useEditTubChangeEntry() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      animalId,
      timestamp,
    }: {
      id: TubChangeId;
      animalId: AnimalId;
      timestamp: Time;
    }) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.editTubChangeEntry(id, animalId, timestamp);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tubChanges'] });
      queryClient.invalidateQueries({ queryKey: ['animalsWithEvents'] });
    },
    retry: 2,
    retryDelay: 1000,
  });
}

export function useDeleteTubChangeEntry() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: TubChangeId) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.deleteTubChangeEntry(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tubChanges'] });
      queryClient.invalidateQueries({ queryKey: ['animalsWithEvents'] });
    },
    retry: 2,
    retryDelay: 1000,
  });
}

export function useGetClutchHistoryForAnimal(animalId: AnimalId) {
  const { actor, isFetching } = useBackendActor();

  return useQuery<ClutchEntry[]>({
    queryKey: ['clutchHistory', animalId],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getClutchHistoryForAnimal(animalId);
      } catch (error) {
        console.error('[Query] Error fetching clutch history:', error);
        return [];
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: STALE_TIME_SHORT,
  });
}

export function useRecordClutch() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ animalId, notes }: { animalId: AnimalId; notes: string }) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.recordClutch(animalId, notes);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['clutchHistory', variables.animalId] });
      queryClient.invalidateQueries({ queryKey: ['animalsWithEvents'] });
    },
    retry: 2,
    retryDelay: 1000,
  });
}

export function useEditClutchEntry() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      animalId,
      timestamp,
      notes,
    }: {
      id: bigint;
      animalId: AnimalId;
      timestamp: Time;
      notes: string;
    }) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.editClutchEntry(id, animalId, timestamp, notes);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clutchHistory'] });
      queryClient.invalidateQueries({ queryKey: ['animalsWithEvents'] });
    },
    retry: 2,
    retryDelay: 1000,
  });
}

export function useDeleteClutchEntry() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.deleteClutchEntry(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clutchHistory'] });
      queryClient.invalidateQueries({ queryKey: ['animalsWithEvents'] });
    },
    retry: 2,
    retryDelay: 1000,
  });
}
