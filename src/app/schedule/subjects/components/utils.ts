import { Subject } from '@/types/schedule';

/**
 * Fetch function for SWR
 */
export const fetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) {
    throw new Error('Network response was not ok');
  }
  return res.json();
});

/**
 * Function to submit a subject (create or update)
 */
export async function submitSubject(subject: Subject) {
  const isNew = !subject.id || subject.id.length < 5;
  const response = await fetch(`/api/subjects`, {
    method: isNew ? 'POST' : 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(subject),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const errorMessage = errorData?.message || 'Failed to save subject';
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Function to delete a subject
 */
export async function deleteSubjectById(id: string) {
  const response = await fetch(`/api/subjects?id=${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const errorMessage = errorData?.message || 'Failed to delete subject';
    throw new Error(errorMessage);
  }

  return response.json();
} 