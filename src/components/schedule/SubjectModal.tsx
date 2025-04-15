import { Subject, subjects } from './types';

interface SubjectModalProps {
  onSelect: (subject: Subject | null) => void;
  onCancel: () => void;
}

/**
 * Modal component for selecting a subject for a schedule slot
 */
export default function SubjectModal({ onSelect, onCancel }: SubjectModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl border-4 border-indigo-200">
        <h3 className="text-xl font-bold mb-4 text-indigo-600 flex items-center">
          <span className="text-2xl mr-2">📚</span>
          בחר מקצוע לשיעור
        </h3>
        
        <div className="grid grid-cols-2 gap-3 mb-6">
          {subjects.map((subject, index) => (
            <button
              key={index}
              className={`p-3 rounded-lg ${subject.color} flex items-center hover:shadow-md transition-all border-2 border-${subject.color.replace('bg-', '')}`}
              onClick={() => onSelect(subject)}
            >
              <span className="text-2xl mr-2">{subject.icon}</span>
              <span className={`${subject.textColor} font-medium`}>{subject.name}</span>
            </button>
          ))}
          
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