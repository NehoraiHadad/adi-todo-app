'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from '@/utils/supabase/client';
import { RefreshCw, MessageSquare } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

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

interface ChildMessagesDisplayProps {
  userId: string;
  userName: string;
  maxMessages?: number;
  showRefreshButton?: boolean;
  autoRefresh?: boolean;
  autoRefreshInterval?: number;
}

export const ChildMessagesDisplay: React.FC<ChildMessagesDisplayProps> = ({
  userId,
  userName,
  maxMessages = 5,
  showRefreshButton = true,
  autoRefresh = true,
  autoRefreshInterval = 30000 // 30 seconds
}) => {
  const [messages, setMessages] = useState<ChildMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [previousMessageCount, setPreviousMessageCount] = useState(0);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [totalMessages, setTotalMessages] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();
  const { toast } = useToast();

  const fetchMessages = useCallback(async (page = 0, pageSize = maxMessages) => {
    if (!userId) return;

    try {
      if (page === 0) {
        setIsLoading(true);
        setError(null);
      } else {
        setIsLoadingMore(true);
      }
      
      // שילוב של הודעות וספירה בquery אחד - אופטימיזציה
      const { data, error, count } = await supabase
        .from('child_messages')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      setTotalMessages(count || 0);

      if (error) throw error;

      const newMessages = data || [];
      const newUnreadCount = newMessages.filter(m => !m.is_read).length;
      const hasNewMessages = newMessages.length > previousMessageCount;
      
      // עדכון הודעות בהתאם למצב pagination
      if (page === 0) {
        setMessages(newMessages);
      } else {
        setMessages(prev => [...prev, ...newMessages]);
      }
      
      setLastRefresh(new Date());
      
      // איפוס אינדקס אם יש הודעות חדשות או אם האינדקס גדול מדי
      if (currentMessageIndex >= newMessages.length && newMessages.length > 0) {
        setCurrentMessageIndex(0);
      }
      
      // התראה על הודעות חדשות (רק אם זה לא הטעינה הראשונה)
      if (hasNewMessages && previousMessageCount > 0 && newUnreadCount > 0) {
        toast({
          title: "הודעה חדשה! 💌",
          description: `קיבלת ${newUnreadCount} הודעות חדשות מההורים`,
        });
        
        // התראה בדפדפן (אם מותר)
        if (Notification.permission === 'granted') {
          new Notification('הודעה חדשה מההורים', {
            body: `קיבלת ${newUnreadCount} הודעות חדשות`,
            icon: '/favicon.ico',
            tag: 'parent-message'
          });
        } else if (Notification.permission !== 'denied') {
          Notification.requestPermission();
        }
      }
      
      setPreviousMessageCount(newMessages.length);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError('שגיאה בטעינת ההודעות. אנא נסי שוב.');
      toast({
        title: "שגיאה",
        description: "לא ניתן לטעון את ההודעות. אנא נסי שוב.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [userId, maxMessages, currentMessageIndex, previousMessageCount, supabase, toast]);

  const handleRefresh = useCallback(() => {
    fetchMessages(0, maxMessages);
  }, [fetchMessages, maxMessages]);

  const loadMoreMessages = useCallback(async () => {
    if (messages.length < totalMessages && !isLoadingMore) {
      const nextPage = Math.floor(messages.length / maxMessages);
      await fetchMessages(nextPage, maxMessages);
    }
  }, [messages.length, totalMessages, isLoadingMore, maxMessages, fetchMessages]);

  const handleMessageUpdate = useCallback(() => {
    // רענון מיידי אחרי שהודעה נקראה
    fetchMessages(0, maxMessages);
  }, [fetchMessages, maxMessages]);

  const nextMessage = useCallback(() => {
    if (messages.length > 0 && currentMessageIndex < messages.length - 1) {
      setCurrentMessageIndex(prev => prev + 1);
    }
  }, [messages.length, currentMessageIndex]);

  const prevMessage = useCallback(() => {
    if (messages.length > 0 && currentMessageIndex > 0) {
      setCurrentMessageIndex(prev => prev - 1);
    }
  }, [messages.length, currentMessageIndex]);

  // רענון ראשוני
  useEffect(() => {
    fetchMessages(0, maxMessages);
  }, [fetchMessages, maxMessages]);

  // רענון אוטומטי
  useEffect(() => {
    if (!autoRefresh || !userId) return;

    const interval = setInterval(() => {
      fetchMessages(0, maxMessages);
    }, autoRefreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, autoRefreshInterval, userId, maxMessages, fetchMessages]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('child_messages_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'child_messages',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('Message change detected:', payload);
          fetchMessages(0, maxMessages);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, supabase, fetchMessages, maxMessages]);

  // Keyboard navigation - enhanced
  useEffect(() => {
    if (maxMessages !== 1 || messages.length <= 1) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        event.preventDefault();
        nextMessage();
      } else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        event.preventDefault();
        prevMessage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentMessageIndex, messages.length, maxMessages, nextMessage, prevMessage]);

  // Mouse wheel navigation - more sensitive
  const handleWheel = useCallback((event: React.WheelEvent) => {
    if (maxMessages !== 1 || messages.length <= 1) return;
    
    event.preventDefault();
    if (event.deltaY > 0) {
      nextMessage();
    } else if (event.deltaY < 0) {
      prevMessage();
    }
  }, [maxMessages, messages.length, nextMessage, prevMessage]);

  // Touch swipe navigation
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (maxMessages !== 1 || messages.length <= 1) return;
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  }, [maxMessages, messages.length]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (maxMessages !== 1 || messages.length <= 1) return;
    setTouchEnd(e.targetTouches[0].clientX);
  }, [maxMessages, messages.length]);

  const handleTouchEnd = useCallback(() => {
    if (maxMessages !== 1 || messages.length <= 1) return;
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      nextMessage();
    } else if (isRightSwipe) {
      prevMessage();
    }
  }, [maxMessages, messages.length, touchStart, touchEnd, nextMessage, prevMessage]);

  const unreadCount = messages.filter(m => !m.is_read).length;

  if (isLoading) {
    return (
      <Card className="shadow-md">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
            <span className="mr-2">טוען הודעות...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="shadow-md border-red-200">
        <CardContent className="p-6">
          <div className="text-center">
            <div className="text-red-500 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-red-600 mb-4">{error}</p>
            <Button 
              onClick={() => fetchMessages(0, maxMessages)}
              variant="outline"
              className="border-red-200 text-red-600 hover:bg-red-50"
            >
              נסה שוב
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header - only show for multi-message mode */}
      {maxMessages > 1 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-pink-600" />
            <h2 className="text-xl font-semibold text-gray-800">ההודעות שלי</h2>
            {unreadCount > 0 && (
              <span className="bg-pink-500 text-white text-xs px-2 py-1 rounded-full">
                {unreadCount} חדשות
              </span>
            )}
          </div>
          
          {showRefreshButton && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              רענן
            </Button>
          )}
        </div>
      )}

      {/* Messages */}
      {maxMessages === 1 ? (
        // Single message card format (like original) with navigation
        <Card 
          className="shadow-md overflow-hidden border-2 border-pink-200 bg-pink-200 cursor-grab active:cursor-grabbing" 
          onWheel={handleWheel}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={() => {
            window.location.href = '/messages';
          }}
        >
          <CardHeader className="pb-2 flex flex-row items-center justify-between bg-pink-200">
            <CardTitle className="text-xl text-pink-700">הודעה מההורים</CardTitle>
            <div className="flex items-center gap-2">
              {/* Message counter */}
              {messages.length > 0 && (
                <span className="text-xs text-pink-600 bg-pink-100 px-2 py-1 rounded">
                  {currentMessageIndex + 1} מתוך {totalMessages}
                </span>
              )}
              {/* New message indicator */}
              {messages.length > 0 && !messages[currentMessageIndex]?.is_read && (
                <span className="bg-pink-500 text-white text-xs px-2 py-1 rounded animate-pulse">חדש</span>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-2 bg-pink-200">
            {messages.length === 0 ? (
              <div className="bg-pink-100 p-4 rounded-lg border border-pink-300">
                <p className="text-gray-700 text-center py-4">
                  אין הודעות חדשות כרגע 😊
                </p>
              </div>
            ) : messages.length > 0 && currentMessageIndex < messages.length ? (
              <div className="bg-pink-100 p-4 rounded-lg border border-pink-300">
                <p className="text-gray-700 text-lg leading-relaxed">
                  {userName}, {messages[currentMessageIndex].content}
                </p>
                
                {/* Navigation and info section */}
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                      {new Date(messages[currentMessageIndex].created_at).toLocaleDateString('he-IL', {
                        year: 'numeric',
                        month: 'numeric',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                    {/* Priority badge */}
                    {messages[currentMessageIndex].priority && messages[currentMessageIndex].priority !== 'normal' && (
                      <span className={`text-xs px-2 py-1 rounded ${
                        messages[currentMessageIndex].priority === 'urgent' ? 'bg-red-100 text-red-800' :
                        messages[currentMessageIndex].priority === 'high' ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {messages[currentMessageIndex].priority === 'urgent' ? 'דחוף!' :
                         messages[currentMessageIndex].priority === 'high' ? 'חשוב' : ''}
                      </span>
                    )}
                  </div>
                  
                  {/* Navigation hint */}
                  {messages.length > 1 && (
                    <div className="text-xs text-pink-600 bg-pink-100 px-2 py-1 rounded">
                      <span>גלול ← → או ↑ ↓</span>
                    </div>
                  )}
                </div>
                
                {/* Sender info */}
                <div className="flex items-center justify-between mt-3">
                  <span className="text-sm text-gray-600 font-medium">
                    {messages[currentMessageIndex].sender_name}
                  </span>
                  
                  {/* Mark as read button */}
                  {!messages[currentMessageIndex].is_read && (
                    <button
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        try {
                          const { error } = await supabase
                            .from('child_messages')
                            .update({ is_read: true })
                            .eq('id', messages[currentMessageIndex].id)
                            .eq('user_id', userId);

                          if (!error) {
                            handleMessageUpdate();
                          }
                        } catch (error) {
                          console.error('Error marking message as read:', error);
                        }
                      }}
                      className="text-xs text-pink-600 hover:text-pink-800 underline"
                    >
                      סמן כנקרא
                    </button>
                  )}
                </div>
                
                {/* Message count shows all info needed */}
              </div>
            ) : (
              <div className="bg-pink-100 p-4 rounded-lg border border-pink-300">
                <p className="text-gray-700 text-center py-4">
                  טוען הודעות...
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        // Multi-message list format
        <Card className="shadow-md overflow-hidden border-2 border-pink-200 bg-pink-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl text-pink-700 flex items-center justify-between">
              <span>הודעות מההורים</span>
              {unreadCount > 0 && (
                <span className="bg-pink-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
                  {unreadCount} חדשות
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            {messages.length === 0 ? (
              <div className="bg-pink-100 p-6 rounded-lg border border-pink-200 text-center">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 text-pink-300" />
                <p className="text-gray-700">אין הודעות חדשות כרגע 😊</p>
                <p className="text-sm text-gray-500 mt-2">
                  עדכון אחרון: {lastRefresh.toLocaleTimeString('he-IL')}
                </p>
              </div>
            ) : (
              <div className="bg-pink-100 rounded-lg border border-pink-200 overflow-hidden">
                <div className="divide-y divide-pink-200">
                  {messages.map((message, _index) => (
                    <div 
                      key={message.id} 
                      className={`p-4 ${!message.is_read ? 'bg-pink-50' : 'bg-white'} hover:bg-pink-50 transition-colors`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-gray-800">{message.sender_name}</span>
                          {message.priority && message.priority !== 'normal' && (
                            <span className={`text-xs px-2 py-1 rounded ${
                              message.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                              message.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {message.priority === 'urgent' ? 'דחוף!' :
                               message.priority === 'high' ? 'חשוב' : ''}
                            </span>
                          )}
                          {message.category && message.category !== 'general' && (
                            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                              {message.category === 'homework' ? '📚 שיעורי בית' :
                               message.category === 'behavior' ? '⭐ התנהגות' :
                               message.category === 'event' ? '🎉 אירוע' :
                               message.category === 'reminder' ? '⏰ תזכורת' : message.category}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {!message.is_read && (
                            <span className="bg-pink-500 text-white text-xs px-2 py-1 rounded animate-pulse">
                              חדש
                            </span>
                          )}
                          <span className="text-xs text-gray-500">
                            {new Date(message.created_at).toLocaleDateString('he-IL', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-gray-700 leading-relaxed">
                        {userName}, {message.content}
                      </p>
                      
                      {message.read_at && (
                        <div className="mt-2 text-xs text-green-600">
                          ✓ נקרא ב-{new Date(message.read_at).toLocaleDateString('he-IL', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      )}
                      
                      {/* Mark as read when message is displayed */}
                      {!message.is_read && (
                        <div className="mt-2">
                          <button
                            onClick={async (e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              try {
                                const { error } = await supabase
                                  .from('child_messages')
                                  .update({ is_read: true })
                                  .eq('id', message.id)
                                  .eq('user_id', userId);

                                if (!error) {
                                  handleMessageUpdate();
                                }
                              } catch (error) {
                                console.error('Error marking message as read:', error);
                              }
                            }}
                            className="text-xs text-pink-600 hover:text-pink-800 underline"
                          >
                            סמן כנקרא
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Load more messages button */}
                {messages.length < totalMessages && (
                  <div className="p-4 bg-pink-50 border-t border-pink-200 text-center">
                    <Button
                      onClick={loadMoreMessages}
                      variant="outline"
                      size="sm"
                      disabled={isLoading || isLoadingMore}
                      className="w-full"
                    >
                      {isLoadingMore ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-pink-600"></div>
                          טוען...
                        </div>
                      ) : (
                        `טען הודעות נוספות (${totalMessages - messages.length})`
                      )}
                    </Button>
                  </div>
                )}
                
                {/* Footer with refresh info */}
                <div className="p-3 bg-pink-50 border-t border-pink-200 text-center">
                  <div className="text-xs text-gray-500">
                    עדכון אחרון: {lastRefresh.toLocaleTimeString('he-IL')}
                    {autoRefresh && (
                      <span className="ml-2">
                        • רענון אוטומטי כל {Math.round(autoRefreshInterval / 1000)} שניות
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};