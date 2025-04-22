import { Subject } from '@/types/schedule';

/**
 * Component for previewing a subject card
 */
export function SubjectPreview({ subject }: { subject: Subject }) {
  return (
    <div className={`p-3 rounded-lg ${subject.color} flex items-center justify-between w-full`}>
      <div className="flex items-center">
        <span className="text-2xl mr-2">{subject.icon}</span>
        <span className={`${subject.textColor} font-medium`}>{subject.name}</span>
      </div>
    </div>
  );
} 