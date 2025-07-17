'use client';

import { useState, useCallback } from 'react';
import { useSWRConfig } from 'swr';
import {  ScheduleData, } from '@/types/schedule';

// Define the type for the schedule data the mutation expects
type SchedulePayload = ScheduleData;
// TODO: Add TimeSlot save logic if needed

interface UseSaveScheduleMutationReturn {
  trigger: (scheduleData: SchedulePayload, classId?: string) => Promise<void>; // Function to call to save
  isSaving: boolean;
  error: Error | null;
}

export function useSaveScheduleMutation(): UseSaveScheduleMutationReturn {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { mutate } = useSWRConfig();

  const trigger = useCallback(
    async (scheduleData: SchedulePayload, classId?: string) => {
      setIsSaving(true);
      setError(null);
      try {
        console.log('Triggering save mutation with (new structure):', scheduleData, 'for class:', classId);
        const url = classId ? `/api/schedule?classId=${classId}` : '/api/schedule';
        const response = await fetch(url, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(scheduleData),
        });

        if (!response.ok) {
          let errorMessage = 'Failed to save schedule';
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
          } catch {
            // Ignore if response body isn't valid JSON
          }
          throw new Error(errorMessage);
        }

        // Success: Invalidate the cache for the GET endpoint
        console.log('Save successful, mutating SWR cache...');
        const cacheKey = classId ? `/api/schedule?classId=${classId}` : '/api/schedule';
        await mutate(cacheKey); 
        // No need to return data, SWR will handle re-fetch

      } catch (err: unknown) {
        console.error('Error during save mutation:', err);
        // Ensure err is an Error before setting state
        const errorToSet = err instanceof Error ? err : new Error('An unknown error occurred during save');
        setError(errorToSet);
        // Re-throw the error so the calling component can handle it (e.g., show alert)
        throw errorToSet; // Throw the potentially new Error object
      } finally {
        setIsSaving(false);
      }
    },
    [mutate] // Dependency: SWR mutate function
  );

  return { trigger, isSaving, error };
} 