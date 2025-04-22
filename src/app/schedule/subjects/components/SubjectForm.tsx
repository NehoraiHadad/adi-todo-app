import { useState } from 'react';
import { Subject } from '@/types/schedule';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/**
 * Form for editing or creating a subject
 */
interface SubjectFormProps {
  subject?: Subject;
  onSubmit: (subject: Subject) => Promise<void>;
  onCancel: () => void;
}

export function SubjectForm({ subject, onSubmit, onCancel }: SubjectFormProps) {
  const [formData, setFormData] = useState<Subject>({
    id: subject?.id || '',
    name: subject?.name || '',
    color: subject?.color || 'bg-gray-100',
    textColor: subject?.textColor || 'text-gray-700',
    icon: subject?.icon || '📝',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const colorOptions = [
    { value: 'bg-red-100', text: 'אדום' },
    { value: 'bg-yellow-100', text: 'צהוב' },
    { value: 'bg-green-100', text: 'ירוק' },
    { value: 'bg-blue-100', text: 'כחול' },
    { value: 'bg-indigo-100', text: 'אינדיגו' },
    { value: 'bg-purple-100', text: 'סגול' },
    { value: 'bg-pink-100', text: 'ורוד' },
    { value: 'bg-slate-100', text: 'אפור' },
    { value: 'bg-amber-100', text: 'ענבר' },
    { value: 'bg-teal-100', text: 'טורקיז' },
    { value: 'bg-violet-100', text: 'סגול כהה' },
    { value: 'bg-rose-100', text: 'ורד' },
    { value: 'bg-orange-100', text: 'כתום' },
    { value: 'bg-amber-50', text: 'ענבר בהיר' },
  ];

  const textColorOptions = [
    { value: 'text-red-700', text: 'אדום' },
    { value: 'text-yellow-700', text: 'צהוב' },
    { value: 'text-green-700', text: 'ירוק' },
    { value: 'text-blue-700', text: 'כחול' },
    { value: 'text-indigo-700', text: 'אינדיגו' },
    { value: 'text-purple-700', text: 'סגול' },
    { value: 'text-pink-700', text: 'ורוד' },
    { value: 'text-slate-700', text: 'אפור' },
    { value: 'text-amber-700', text: 'ענבר' },
    { value: 'text-teal-700', text: 'טורקיז' },
    { value: 'text-violet-700', text: 'סגול כהה' },
    { value: 'text-rose-700', text: 'ורד' },
    { value: 'text-orange-700', text: 'כתום' },
    { value: 'text-amber-800', text: 'ענבר כהה' },
  ];

  const commonEmojis = ['📚', '📝', '📏', '📐', '🔤', '📕', '📖', '🧠', '⚽', '🌱', '🎨', '📜', '🕯️', '🌟', '💻', '🕮', '✏️', '📊', '🎯', '🔍'];

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-white rounded-lg shadow-md max-w-md mx-auto">
      <h2 className="text-xl font-bold text-indigo-600 text-center">
        {subject ? 'עריכת מקצוע' : 'הוספת מקצוע חדש'}
      </h2>
      
      <div className="space-y-2">
        <Label htmlFor="name">שם המקצוע</Label>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          className="text-right"
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="color">צבע רקע</Label>
          <select
            id="color"
            name="color"
            value={formData.color}
            onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
            className="w-full p-2 border rounded-md text-right"
          >
            {colorOptions.map(option => (
              <option key={option.value} value={option.value} className={option.value}>
                {option.text}
              </option>
            ))}
          </select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="textColor">צבע טקסט</Label>
          <select
            id="textColor"
            name="textColor"
            value={formData.textColor}
            onChange={(e) => setFormData(prev => ({ ...prev, textColor: e.target.value }))}
            className="w-full p-2 border rounded-md text-right"
          >
            {textColorOptions.map(option => (
              <option key={option.value} value={option.value} className={option.value}>
                {option.text}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="icon">אייקון</Label>
        <div className="grid grid-cols-5 gap-2 mb-4">
          {commonEmojis.map(emoji => (
            <button
              type="button"
              key={emoji}
              className={`p-2 text-xl rounded-md ${formData.icon === emoji ? 'bg-indigo-100 border-2 border-indigo-400' : 'bg-gray-50 hover:bg-gray-100'}`}
              onClick={() => setFormData(prev => ({ ...prev, icon: emoji }))}
            >
              {emoji}
            </button>
          ))}
        </div>
        <Input
          id="icon"
          name="icon"
          value={formData.icon}
          onChange={handleChange}
          className="text-right"
        />
      </div>
      
      <div className="flex justify-center gap-3 mt-6">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Spinner size="sm" /> : subject ? 'עדכן מקצוע' : 'הוסף מקצוע'}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          ביטול
        </Button>
      </div>
    </form>
  );
} 