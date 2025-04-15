'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { moodsApi } from '@/services/api';
import { Mood } from '@/types';
import { useToast } from "@/components/ui/use-toast";

interface MoodSelectorProps {
  userId?: string;
}

// Define available moods
const availableMoods = [
  { type: 'happy', emoji: '😊', label: 'שמח', color: 'yellow' },
  { type: 'tired', emoji: '😴', label: 'עייף', color: 'blue' },
  { type: 'curious', emoji: '🤔', label: 'סקרן', color: 'purple' },
  { type: 'sad', emoji: '😢', label: 'עצוב', color: 'red' }
];

export const MoodSelector: React.FC<MoodSelectorProps> = ({ userId }) => {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [todayMood, setTodayMood] = useState<Mood | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  // Load today's mood if it exists
  useEffect(() => {
    const fetchTodayMood = async () => {
      if (!userId) return;
      
      try {
        const mood = await moodsApi.getTodayMood();
        if (mood) {
          setTodayMood(mood);
          setSelectedMood(mood.mood_type);
          setNotes(mood.notes || '');
        }
      } catch (error) {
        console.error('Error fetching today\'s mood:', error);
      }
    };
    
    fetchTodayMood();
  }, [userId]);
  
  // Handle mood selection
  const handleMoodSelect = (moodType: string) => {
    setSelectedMood(moodType);
  };
  
  // Handle notes change
  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(e.target.value);
  };
  
  // Handle saving mood
  const handleSaveMood = async () => {
    if (!userId || !selectedMood) return;
    
    setIsSubmitting(true);
    try {
      const selectedMoodObj = availableMoods.find(mood => mood.type === selectedMood);
      if (!selectedMoodObj) return;
      
      const moodData: Partial<Mood> = {
        user_id: userId,
        mood_type: selectedMood,
        emoji: selectedMoodObj.emoji,
        notes: notes.trim() || null
      };
      
      const result = await moodsApi.createMood(moodData);
      setTodayMood(result);
      
      toast({
        title: "מצב רוח נשמר!",
        description: "תודה שסיפרת לנו איך את מרגישה היום",
        variant: "success",
      });
    } catch (error) {
      console.error('Error saving mood:', error);
      toast({
        title: "שגיאה",
        description: "לא הצלחנו לשמור את מצב הרוח שלך",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Card className="shadow-md border-2 border-yellow-200 overflow-hidden bg-yellow-50">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl text-yellow-700">איך את מרגישה היום?</CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="flex justify-around gap-2 mb-2">
          {availableMoods.map(mood => (
            <Button
              key={mood.type}
              variant="outline"
              size="icon"
              className={`h-16 w-16 rounded-full ${
                `bg-${mood.color}-100 hover:bg-${mood.color}-200 hover:scale-110 transition-all border-2 border-${mood.color}-300`
              } ${selectedMood === mood.type ? `ring-2 ring-${mood.color}-500 border-${mood.color}-400` : ''}`}
              onClick={() => handleMoodSelect(mood.type)}
            >
              <span role="img" aria-label={mood.label} className="text-3xl">{mood.emoji}</span>
            </Button>
          ))}
        </div>
        <div className="mt-4">
          <Textarea
            placeholder="ולמה את מרגישה ככה?"
            className="w-full p-3 rounded-lg border-2 border-yellow-200 focus:border-yellow-400 focus:ring-yellow-400 focus:outline-none resize-none text-right"
            rows={3}
            dir="rtl"
            value={notes}
            onChange={handleNotesChange}
          />
        </div>
        {selectedMood && (
          <div className="mt-3 flex justify-end">
            <Button 
              onClick={handleSaveMood}
              disabled={isSubmitting}
              className="bg-yellow-500 hover:bg-yellow-600 text-white"
            >
              {todayMood ? 'עדכון' : 'שמירה'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 