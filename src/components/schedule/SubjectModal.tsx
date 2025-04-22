import { Subject } from '@/types/schedule';
import useSWR from 'swr';
import { Spinner } from '@/components/ui/Spinner';

// Fetch function for SWR
const fetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) {
    throw new Error('Network response was not ok');
  }
  return res.json();
});

interface SubjectModalProps {
  onSelect: (subject: Subject | null) => void;
  onCancel: () => void;
}

/**
 * Modal component for selecting a subject for a schedule slot
 */
export default function SubjectModal({ onSelect, onCancel }: SubjectModalProps) {
  // Fetch subjects from API
  const { data: subjects, error, isLoading } = useSWR('/api/subjects', fetcher);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl border-4 border-indigo-200 flex flex-col items-center">
          <Spinner size="lg" />
          <p className="mt-4 text-gray-600">טוען רשימת מקצועות...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl border-4 border-indigo-200">
          <h3 className="text-xl font-bold mb-4 text-red-600">שגיאה בטעינת המקצועות</h3>
          <p className="text-gray-700 mb-4">{error.message}</p>
          <div className="flex justify-end">
            <button
              className="btn bg-gray-200 text-gray-700 hover:bg-gray-300 flex items-center"
              onClick={onCancel}
            >
              <span className="text-xl mr-2">↩️</span>
              חזור
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl border-4 border-indigo-200">
        <h3 className="text-xl font-bold mb-4 text-indigo-600 flex items-center">
          <span className="text-2xl mr-2">📚</span>
          בחר מקצוע לשיעור
        </h3>
        
        <div className="grid grid-cols-2 gap-3 mb-6">
          {subjects && subjects.map((subject: Subject) => {
            // Provide default values if color is undefined
            const bgColor = subject.color || 'bg-gray-100'; 
            const borderColor = subject.color ? `border-${subject.color.replace('bg-', '')}` : 'border-gray-200';

            return (
              <button
                key={subject.id}
                // Use the calculated default values
                className={`p-3 rounded-lg ${bgColor} flex items-center hover:shadow-md transition-all border-2 ${borderColor}`}
                onClick={() => onSelect(subject)}
              >
                <span className="text-2xl mr-2">{subject.icon || '📝'}</span>
                <span className={`${subject.textColor || 'text-gray-700'} font-medium`}>{subject.name}</span>
              </button>
            );
          })}
          
          <button
            className="p-3 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all col-span-2 flex items-center justify-center"
            onClick={() => onSelect(null)}
          >
            <span className="text-xl mr-2">❌</span>
            הסר שיעור
          </button>
        </div>
        
        <div className="flex justify-end">
          <button
            className="btn bg-gray-200 text-gray-700 hover:bg-gray-300 flex items-center"
            onClick={onCancel}
          >
            <span className="text-xl mr-2">↩️</span>
            ביטול
          </button>
        </div>
      </div>
    </div>
  );
} 