import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// DELETE /api/schedules/[id] - Delete a specific schedule item
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const params = await context.params;
    const { id } = params;
    
    // Check if the schedule item belongs to the user
    const { data: existingSchedule, error: fetchError } = await supabase
      .from('schedules')
      .select('user_id, is_shared')
      .eq('id', id)
      .single();
    
    if (fetchError) {
      console.error('Error fetching schedule for deletion:', fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }
    
    if (!existingSchedule) {
      return NextResponse.json({ error: 'Schedule item not found' }, { status: 404 });
    }
    
    if (existingSchedule.user_id !== user.id && !existingSchedule.is_shared) {
      return NextResponse.json(
        { error: 'Unauthorized to delete this schedule item' },
        { status: 403 }
      );
    }
    
    const { error } = await supabase
      .from('schedules')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting schedule item:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ message: 'Schedule item deleted successfully' });
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PATCH /api/schedules/[id] - Update a specific schedule item
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const params = await context.params;
    const { id } = params;
    const updates = await request.json();
    
    // Check if the schedule item belongs to the user
    const { data: existingSchedule, error: fetchError } = await supabase
      .from('schedules')
      .select('user_id, is_shared')
      .eq('id', id)
      .single();
    
    if (fetchError) {
      console.error('Error fetching schedule for update:', fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }
    
    if (!existingSchedule) {
      return NextResponse.json({ error: 'Schedule item not found' }, { status: 404 });
    }
    
    if (existingSchedule.user_id !== user.id && !existingSchedule.is_shared) {
      return NextResponse.json(
        { error: 'Unauthorized to update this schedule item' },
        { status: 403 }
      );
    }
    
    // Remove user_id from updates if it exists to prevent changing ownership
    delete updates.user_id;
    
    // First update the record
    const { error: updateError } = await supabase
      .from('schedules')
      .update(updates)
      .eq('id', id);
    
    if (updateError) {
      console.error('Error updating schedule:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
    
    // Then fetch the updated record separately
    const { data, error: fetchUpdatedError } = await supabase
      .from('schedules')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchUpdatedError) {
      console.error('Error fetching updated schedule:', fetchUpdatedError);
      // Return success even if we can't fetch the updated record
      return NextResponse.json({ message: 'Update successful but could not fetch updated data' });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 