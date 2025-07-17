'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { createClient } from '@/utils/supabase/client';

interface ChildMessage {
  id: string;
  user_id: string;
  sender_id?: string;
  sender_name: string;
  content: string;
  is_read: boolean;
  priority?: string;
  category?: string;
  created_at: string;
  read_at?: string;
}

interface ParentMessageCardProps {
  message?: ChildMessage;
  userName: string;
  userId: string;
  onMessagesUpdate?: () => void;
}

export const ParentMessageCard: React.FC<ParentMessageCardProps> = ({ 
  message: initialMessage, 
  userName, 
  userId,
  onMessagesUpdate 
}) => {
  const [message, setMessage] = useState<ChildMessage | undefined>(initialMessage);
  const [isMarkingAsRead, setIsMarkingAsRead] = useState(false);
  const supabase = createClient();
  
  // Mark message as read when it's displayed
  useEffect(() => {
    const markAsRead = async () => {
      if (message && !message.is_read && !isMarkingAsRead) {
        try {
          setIsMarkingAsRead(true);
          
          const { error } = await supabase
            .from('child_messages')
            .update({ is_read: true })
            .eq('id', message.id)
            .eq('user_id', userId);

          if (error) throw error;

          // Update the local message to show as read
          setMessage(prev => prev ? { ...prev, is_read: true, read_at: new Date().toISOString() } : undefined);
          
          // Notify parent component if callback provided
          if (onMessagesUpdate) {
            onMessagesUpdate();
          }
        } catch (error) {
          console.error('Error marking message as read:', error);
        } finally {
          setIsMarkingAsRead(false);
        }
      }
    };
    
    markAsRead();
  }, [message, userId, isMarkingAsRead, onMessagesUpdate, supabase]);
  
  // Format the created_at date
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('he-IL', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Get first letter of each word in sender name for the avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('');
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-300'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300'
      case 'normal': return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-300'
      default: return 'bg-pink-100 text-pink-800 border-pink-300'
    }
  };

  const getPriorityText = (priority?: string) => {
    switch (priority) {
      case 'urgent': return 'דחוף!'
      case 'high': return 'חשוב'
      case 'normal': return ''
      case 'low': return ''
      default: return ''
    }
  };

  const getCategoryText = (category?: string) => {
    switch (category) {
      case 'homework': return '📚 שיעורי בית'
      case 'behavior': return '⭐ התנהגות'
      case 'event': return '🎉 אירוע'
      case 'reminder': return '⏰ תזכורת'
      case 'general': return '💬 כללי'
      default: return '💬 הודעה'
    }
  };
  
  return (
    <Card className={`shadow-md overflow-hidden border-2 ${message?.priority === 'urgent' ? 'border-red-300 bg-red-50' : message?.priority === 'high' ? 'border-orange-300 bg-orange-50' : 'border-pink-200 bg-pink-50'}`}>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <CardTitle className="text-xl text-pink-700">הודעה מההורים</CardTitle>
          {message?.category && (
            <Badge variant="outline" className="text-xs">
              {getCategoryText(message.category)}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {message?.priority && getPriorityText(message.priority) && (
            <Badge className={getPriorityColor(message.priority)}>
              {getPriorityText(message.priority)}
            </Badge>
          )}
          {message && !message.is_read && (
            <Badge className="bg-pink-500 animate-pulse">חדש</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        {message ? (
          <div className={`p-4 rounded-lg border ${message.priority === 'urgent' ? 'bg-red-100 border-red-200' : message.priority === 'high' ? 'bg-orange-100 border-orange-200' : 'bg-pink-100 border-pink-200'}`}>
            <p className="text-gray-700 text-lg leading-relaxed">
              {userName}, {message.content}
            </p>
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">
                  {formatDate(message.created_at)}
                </span>
                {message.read_at && (
                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                    ✓ נקרא
                  </Badge>
                )}
              </div>
              <div className="flex items-center">
                <Avatar className="h-6 w-6 mr-2">
                  <AvatarFallback className="bg-pink-200 text-pink-700 text-xs">
                    {getInitials(message.sender_name)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-gray-500">{message.sender_name}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-pink-100 p-4 rounded-lg border border-pink-200">
            <p className="text-gray-700 text-center py-4">
              אין הודעות חדשות כרגע 😊
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 