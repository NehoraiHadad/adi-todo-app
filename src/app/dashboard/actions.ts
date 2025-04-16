'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createItem(formData: FormData) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { error: 'Unauthorized' };
    }
    
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    
    if (!title) {
      return { error: 'Title is required' };
    }
    
    const { data, error } = await supabase
      .from('dashboard_items')
      .insert({
        user_id: user.id,
        title,
        description,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating item:', error);
      return { error: error.message };
    }
    
    revalidatePath('/dashboard');
    return { data };
  } catch (error) {
    console.error('Error in createItem:', error);
    return { error: 'An unexpected error occurred' };
  }
}

export async function deleteItem(itemId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { error: 'Unauthorized' };
    }
    
    // First check if the item belongs to the user
    const { data: item, error: fetchError } = await supabase
      .from('dashboard_items')
      .select('user_id')
      .eq('id', itemId)
      .single();
    
    if (fetchError) {
      console.error('Error fetching item for deletion:', fetchError);
      return { error: fetchError.message };
    }
    
    if (!item) {
      return { error: 'Item not found' };
    }
    
    if (item.user_id !== user.id) {
      return { error: 'Unauthorized to delete this item' };
    }
    
    const { error } = await supabase
      .from('dashboard_items')
      .delete()
      .eq('id', itemId);
    
    if (error) {
      console.error('Error deleting item:', error);
      return { error: error.message };
    }
    
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Error in deleteItem:', error);
    return { error: 'An unexpected error occurred' };
  }
} 