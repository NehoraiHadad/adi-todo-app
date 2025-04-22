import { NextResponse } from 'next/server';
import { fetchSubjects } from '@/server/schedule/queries';
import { saveSubject, deleteSubject } from '@/server/schedule/mutations';
import { z } from 'zod';

// Schema for subject validation
const subjectSchema = z.object({
  id: z.string().optional().default(''), // Default to empty string instead of undefined
  name: z.string().min(1, "Subject name is required"),
  color: z.string().optional().default('bg-gray-100'),
  textColor: z.string().optional().default('text-gray-700'),
  icon: z.string().optional().default('📝'),
});

/**
 * GET handler to fetch all subjects
 */
export async function GET() {
  try {
    const subjects = await fetchSubjects();
    return NextResponse.json(subjects);
  } catch (error: unknown) {
    console.error('[API /subjects GET] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { message: `Failed to fetch subjects: ${errorMessage}` },
      { status: 500 }
    );
  }
}

/**
 * POST handler to create a new subject
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validationResult = subjectSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { message: 'Invalid subject data', errors: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    
    const subject = validationResult.data;
    const result = await saveSubject(subject);
    
    if (result.success) {
      return NextResponse.json({ message: 'Subject created successfully', id: result.id });
    } else {
      return NextResponse.json(
        { message: 'Failed to create subject' },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    console.error('[API /subjects POST] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { message: `Failed to create subject: ${errorMessage}` },
      { status: 500 }
    );
  }
}

/**
 * PUT handler to update an existing subject
 */
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    
    // Validate request body and ensure id exists
    const validationSchema = subjectSchema.extend({
      id: z.string().min(1, "Subject ID is required for updates"),
    });
    
    const validationResult = validationSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { message: 'Invalid subject data', errors: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    
    const subject = validationResult.data;
    const result = await saveSubject(subject);
    
    if (result.success) {
      return NextResponse.json({ message: 'Subject updated successfully' });
    } else {
      return NextResponse.json(
        { message: 'Failed to update subject' },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    console.error('[API /subjects PUT] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { message: `Failed to update subject: ${errorMessage}` },
      { status: 500 }
    );
  }
}

/**
 * DELETE handler to delete a subject
 */
export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { message: 'Subject ID is required' },
        { status: 400 }
      );
    }
    
    const result = await deleteSubject(id);
    
    if (result.success) {
      return NextResponse.json({ message: 'Subject deleted successfully' });
    } else {
      return NextResponse.json(
        { message: 'Failed to delete subject' },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    console.error('[API /subjects DELETE] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { message: `Failed to delete subject: ${errorMessage}` },
      { status: 500 }
    );
  }
} 