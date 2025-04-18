// tests/app/api/schedule/route.test.ts
import { describe, it, expect, vi } from 'vitest';
import { GET, PATCH } from '@/app/api/schedule/route'; // Import route handlers
import { NextResponse } from 'next/server';

// Mock server functions
vi.mock('@/server/schedule/queries', () => ({
  fetchScheduleData: vi.fn().mockResolvedValue({ Sunday: [], Monday: [] }), // Mock data
  fetchTimeSlots: vi.fn().mockResolvedValue([{id: 0, startTime: '08:00', endTime: '08:45'}]),
}));
vi.mock('@/server/schedule/mutations', () => ({
  saveScheduleData: vi.fn().mockResolvedValue({ success: true, message: 'Saved' }),
}));

// Mock NextResponse
vi.mock('next/server', async (importOriginal) => {
    const mod = await importOriginal<typeof import('next/server')>();
    return {
        ...mod,
        NextResponse: {
            json: vi.fn((body, init) => ({ // Return simple object representation
                body: body,
                status: init?.status || 200,
            })),
        },
    };
});

describe('API Route: /api/schedule', () => {
  describe('GET', () => {
    it('should fetch schedule and timeslots and return them', async () => {
      await GET();
      // TODO: Assert response structure and status
      expect(NextResponse.json).toHaveBeenCalled();
      // expect(response.status).toBe(200);
      // expect(response.body).toHaveProperty('schedule');
      // expect(response.body).toHaveProperty('timeSlots');
    });

    // TODO: Add test for error handling in GET
  });

  describe('PATCH', () => {
    it('should validate input and call saveScheduleData on valid data', async () => {
      const mockRequest = {
        json: async () => ({
          // TODO: Provide valid schedule data matching Zod schema
          Sunday: [],
          Monday: [{id: 'math', name:'Math'}]
        }),
      } as Request;

      await PATCH(mockRequest);
      // TODO: Assert saveScheduleData was called
      // TODO: Assert response structure and status
      expect(NextResponse.json).toHaveBeenCalledWith({ message: 'Saved' });
      // expect(response.status).toBe(200);
    });

    it('should return 400 on invalid input structure (Zod)', async () => {
      const mockRequest = {
        json: async () => ({ invalid: 'data' }), // Data not matching schema
      } as Request;
      await PATCH(mockRequest);
      // TODO: Assert response status is 400
      expect(NextResponse.json).toHaveBeenCalledWith(expect.anything(), { status: 400 });
    });

    // TODO: Add test for detailed server-side validation failure (when implemented)
    // TODO: Add test for error handling during save
  });
}); 