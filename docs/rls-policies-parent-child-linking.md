# RLS Policies for Parent-Child Data Viewing

This document outlines the Row Level Security (RLS) policies required to allow parents to view the data of their children with whom they have an approved link in the `parent_child_links` table.

These policies should be applied to your Supabase database.

## General Principle

For each relevant table containing child-specific data (e.g., `tasks`, `schedules`, `moods`), a new `SELECT` policy is added. This policy checks if the currently authenticated user (`auth.uid()`) is listed as a `parent_id` in an `approved` record in `parent_child_links` where the `child_id` matches the `user_id` (or equivalent foreign key) of the row being accessed.

These policies are in addition to existing policies that allow users to view their own data or shared data.

## Policies

### 1. `tasks` Table

Allows parents to view tasks belonging to their linked children.

```sql
CREATE POLICY "parents_can_view_linked_children_tasks" ON tasks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM parent_child_links pcl
            WHERE pcl.parent_id = auth.uid()
            AND pcl.child_id = tasks.user_id -- Assumes tasks.user_id is the child's ID
            AND pcl.status = 'approved'
        )
    );
```

### 2. `schedules` Table

Allows parents to view schedules belonging to their linked children. This typically applies to the child's personal schedules.

```sql
CREATE POLICY "parents_can_view_linked_children_schedules" ON schedules
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM parent_child_links pcl
            WHERE pcl.parent_id = auth.uid()
            AND pcl.child_id = schedules.user_id -- Assumes schedules.user_id is the child's ID
            AND pcl.status = 'approved'
            -- Consider adding "AND schedules.is_shared = false" if parents should only see personal schedules via this rule.
        )
    );
```

### 3. `moods` Table

Allows parents to view mood entries of their linked children.

```sql
CREATE POLICY "parents_can_view_linked_children_moods" ON moods
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM parent_child_links pcl
            WHERE pcl.parent_id = auth.uid()
            AND pcl.child_id = moods.user_id -- Assumes moods.user_id is the child's ID
            AND pcl.status = 'approved'
        )
    );
```

### 4. `equipment` Table

Allows parents to view equipment lists of their linked children.

**Note:** Assumes the `equipment` table has a `user_id` column referencing the child. The `EquipmentItem` type in `src/types/index.ts` does not explicitly show `user_id`, so this table's structure needs confirmation. If `equipment` is linked to `schedule` items which are user-linked, the policy might need to be more complex or applied differently. Assuming a direct `user_id` link for now.

```sql
CREATE POLICY "parents_can_view_linked_children_equipment" ON equipment
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM parent_child_links pcl
            WHERE pcl.parent_id = auth.uid()
            AND pcl.child_id = equipment.user_id -- Verify 'equipment.user_id' is the correct column
            AND pcl.status = 'approved'
        )
    );
```

### 5. `rewards` Table

Allows parents to view rewards received by their linked children.

```sql
CREATE POLICY "parents_can_view_linked_children_rewards" ON rewards
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM parent_child_links pcl
            WHERE pcl.parent_id = auth.uid()
            AND pcl.child_id = rewards.user_id -- Assumes rewards.user_id is the child's ID
            AND pcl.status = 'approved'
        )
    );
```

### 6. `house_chores` Table

Allows parents to view house chores assigned to their linked children.

**Note:** The `HouseChore` type has `assigned_to` which might be the child's user ID.

```sql
CREATE POLICY "parents_can_view_linked_children_house_chores" ON house_chores
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM parent_child_links pcl
            WHERE pcl.parent_id = auth.uid()
            AND pcl.child_id = house_chores.assigned_to -- Verify 'house_chores.assigned_to' is the child's user ID
            AND pcl.status = 'approved'
        )
    );
```

### 7. `parent_messages` Table (Viewing Sent/Received Messages)

To allow both sender (parent/teacher) and recipient (child) to view messages in the `parent_messages` table:

**Pre-requisite:** Ensure the `parent_messages` table has a `sender_id` column (UUID, references `auth.users.id`) that stores the ID of the message sender. The existing insert policy (`privileged_can_insert_messages`) should be updated to populate this `sender_id` with `auth.uid()`. The `ParentMessage` type in `src/types/index.ts` needs to be updated to include `sender_id`.

**Policy Update:**
The existing policy `users_can_view_their_messages` (which likely only allows `auth.uid() = user_id` where `user_id` is the recipient) should be modified or replaced.

```sql
-- Ensure old SELECT policy for this table is dropped or altered.
-- Example: DROP POLICY IF EXISTS "users_can_view_their_messages" ON parent_messages;
CREATE POLICY "participants_can_view_parent_messages" ON parent_messages
    FOR SELECT USING (
        (auth.uid() = user_id) OR (auth.uid() = sender_id)
    );
```
Remember to adjust column names like `tasks.user_id`, `equipment.user_id`, `house_chores.assigned_to` if they differ in your actual schema. Also confirm `equipment` table structure.
