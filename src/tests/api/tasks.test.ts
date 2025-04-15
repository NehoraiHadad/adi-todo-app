import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { GET, POST } from '@/app/api/tasks/route';
import { PATCH, DELETE } from '@/app/api/tasks/[id]/route';

// Mock the necessary dependencies
jest.mock('@/utils/supabase/server', () => ({
  createClient: jest.fn()
}));

jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn(),
  },
}));

describe('בדיקות שמחות לניהול משימות 🎮', () => {
  let mockSupabase: any;
  let mockRequest: any;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Setup mock Supabase client
    mockSupabase = {
      auth: {
        getUser: jest.fn(),
      },
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn(),
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabase);

    // Setup mock request
    mockRequest = {
      nextUrl: {
        searchParams: new URLSearchParams(),
      },
      json: jest.fn().mockResolvedValue({}),
    };
  });

  describe('GET /api/tasks - קבלת רשימת משימות 📋', () => {
    test('חייבים להתחבר כדי לקבל משימות 🔐', async () => {
      // Setup - unauthenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });
      
      // Act
      await GET(mockRequest);
      
      // Assert
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    });

    test('מקבלים רק את המשימות של המשתמש והמשימות המשותפות 👧', async () => {
      // Setup - authenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user123' } },
        error: null,
      });
      
      // Mock Supabase query response
      mockSupabase.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        or: jest.fn().mockImplementation(() => ({
          order: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnValue({ data: [
            { id: '1', title: 'משימה אישית', user_id: 'user123' },
            { id: '2', title: 'משימה משותפת', user_id: 'teacher', is_shared: true },
          ], error: null }),
        })),
      }));
      
      // Act
      await GET(mockRequest);
      
      // Assert
      expect(mockSupabase.from).toHaveBeenCalledWith('tasks');
      expect(NextResponse.json).toHaveBeenCalled();
    });
  });

  describe('POST /api/tasks - יצירת משימה חדשה 🌱', () => {
    test('בודקים שהמידע תקין ומוסיפים את המשתמש למשימה 🧩', async () => {
      // Setup - authenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user123' } },
        error: null,
      });
      
      // Mock request body
      mockRequest.json.mockResolvedValue({
        title: 'משימה חדשה',
        due_date: '2023-05-15',
      });
      
      // Mock insert response
      const mockInsertedTask = {
        id: 'task123',
        title: 'משימה חדשה',
        due_date: '2023-05-15',
        user_id: 'user123',
        is_completed: false,
      };
      
      mockSupabase.from.mockImplementation(() => ({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnValue({ data: mockInsertedTask, error: null }),
      }));
      
      // Act
      await POST(mockRequest);
      
      // Assert
      expect(mockSupabase.from).toHaveBeenCalledWith('tasks');
      expect(NextResponse.json).toHaveBeenCalledWith(mockInsertedTask, { status: 201 });
    });
  });

  describe('PATCH /api/tasks/[id] - עדכון משימה קיימת 🔄', () => {
    test('לא מאפשרים לעדכן משימות של משתמשים אחרים 🛑', async () => {
      // Setup - authenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user123' } },
        error: null,
      });
      
      // Mock request body
      mockRequest.json.mockResolvedValue({
        title: 'משימה מעודכנת',
      });
      
      // Mock params
      const mockParams = { id: 'task456' };
      
      // Mock getting existing task - belongs to a different user
      const mockExistingTask = {
        id: 'task456',
        title: 'משימה של מישהו אחר',
        user_id: 'other_user',
        is_shared: false,
      };
      
      mockSupabase.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnValue({ data: mockExistingTask, error: null }),
      }));
      
      // Act
      await PATCH(mockRequest, { params: mockParams } as any);
      
      // Assert - Update expected error message to match actual implementation
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'Unauthorized to update this task' },
        { status: 403 }
      );
    });
  });
}); 