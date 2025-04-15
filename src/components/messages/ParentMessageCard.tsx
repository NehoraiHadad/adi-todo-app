'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { parentMessagesApi } from '@/services/api';
import { ParentMessage } from '@/types';

interface ParentMessageCardProps {
  message?: ParentMessage;
  userName: string;
}

export const ParentMessageCard: React.FC<ParentMessageCardProps> = ({ message: initialMessage, userName }) => {
  const [message, setMessage] = useState<ParentMessage | undefined>(initialMessage);
  
  // Mark message as read when it's displayed
  useEffect(() => {
    const markAsRead = async () => {
      if (message && !message.is_read) {
        try {
          await parentMessagesApi.markAsRead([message.id]);
          // Update the local message to show as read
          setMessage(prev => prev ? { ...prev, is_read: true } : undefined);
        } catch (error) {
          console.error('Error marking message as read:', error);
        }
      }
    };
    
    markAsRead();
  }, [message]);
  
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
  
  return (
    <Card className="shadow-md overflow-hidden border-2 border-pink-200 bg-pink-50">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-xl text-pink-700">הודעה מההורים</CardTitle>
        {message && !message.is_read && (
          <Badge className="bg-pink-500">חדש</Badge>
        )}
      </CardHeader>
      <CardContent className="pt-2">
        {message ? (
          <div className="bg-pink-100 p-4 rounded-lg border border-pink-200">
            <p className="text-gray-700">
              {userName}, {message.content}
            </p>
            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-gray-500">
                {formatDate(message.created_at)}
              </span>
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
              אין הודעות חדשות כרגע
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 