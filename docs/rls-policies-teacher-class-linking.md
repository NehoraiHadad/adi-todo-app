# RLS Policies for Teacher-Student/Class Linking

This document outlines the Row Level Security (RLS) policies related to teachers managing their classes and accessing data for students enrolled in those classes, as well as students accessing class information.

These policies should be applied to your Supabase database.

## `classes` Table

Policies for the `classes` table (stores class information).

1.  **Teachers can create classes:**
    *   The API endpoint `POST /api/classes` already verifies the user is a teacher before inserting.
    *   RLS can enforce that `teacher_id` matches `auth.uid()` upon insert.
    ```sql
    CREATE POLICY "teachers_can_create_classes" ON classes
        FOR INSERT WITH CHECK (
            auth.uid() = teacher_id 
            AND (SELECT role FROM user_roles WHERE user_id = auth.uid() AND role = 'teacher' LIMIT 1) IS NOT NULL
        );
    ```

2.  **Teachers can view their own classes:**
    ```sql
    CREATE POLICY "teachers_can_view_own_classes" ON classes
        FOR SELECT USING (auth.uid() = teacher_id);
    ```

3.  **Teachers can update their own classes:**
    ```sql
    CREATE POLICY "teachers_can_update_own_classes" ON classes
        FOR UPDATE USING (auth.uid() = teacher_id)
        WITH CHECK (auth.uid() = teacher_id);
    ```

4.  **Teachers can delete their own classes (consider cascade implications):**
    ```sql
    CREATE POLICY "teachers_can_delete_own_classes" ON classes
        FOR DELETE USING (auth.uid() = teacher_id);
    ```

5.  **Students can view details of classes they are enrolled in:**
    ```sql
    CREATE POLICY "students_can_view_enrolled_classes_details" ON classes
        FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM student_class_enrollments sce
                WHERE sce.class_id = classes.id
                AND sce.student_id = auth.uid()
                AND sce.status = 'approved'
            )
        );
    ```
    *(Note: The API `/api/enrollments/student` already provides class details for enrolled students. This RLS provides direct access protection if students were to query `classes`.)*

## `student_class_enrollments` Table

Policies for the `student_class_enrollments` table.

1.  **Students can create their own enrollment requests (e.g., by joining with a class code):**
    *   The API endpoint `POST /api/enrollments/join` handles this, verifying student role and class code.
    *   RLS ensures `student_id` matches `auth.uid()`.
    ```sql
    CREATE POLICY "students_can_create_own_enrollments" ON student_class_enrollments
        FOR INSERT WITH CHECK (
            auth.uid() = student_id
            AND (SELECT role FROM user_roles WHERE user_id = auth.uid() AND role = 'student' LIMIT 1) IS NOT NULL
        );
    ```

2.  **Students can view their own enrollments:**
    ```sql
    CREATE POLICY "students_can_view_own_enrollments" ON student_class_enrollments
        FOR SELECT USING (auth.uid() = student_id);
    ```

3.  **Students can (conditionally) delete their own enrollments (i.e., leave a class):**
    *   This might be allowed for 'approved' enrollments.
    ```sql
    CREATE POLICY "students_can_delete_own_enrollments" ON student_class_enrollments
        FOR DELETE USING (auth.uid() = student_id AND status = 'approved');
    ```

4.  **Teachers can view enrollments for their classes:**
    ```sql
    CREATE POLICY "teachers_can_view_enrollments_for_their_classes" ON student_class_enrollments
        FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM classes c
                WHERE c.id = student_class_enrollments.class_id
                AND c.teacher_id = auth.uid()
            )
        );
    ```

5.  **Teachers can (conditionally) update enrollment status (e.g., if a manual approval step was added):**
    *   Currently, joining by code auto-approves. If a teacher approval flow is added, this policy would be needed.
    ```sql
    /* Example if teacher approval was a feature:
    CREATE POLICY "teachers_can_update_enrollment_status_for_their_classes" ON student_class_enrollments
        FOR UPDATE USING (
            EXISTS (
                SELECT 1 FROM classes c
                WHERE c.id = student_class_enrollments.class_id
                AND c.teacher_id = auth.uid()
            )
        )
        WITH CHECK ( 
            EXISTS (
                SELECT 1 FROM classes c
                WHERE c.id = student_class_enrollments.class_id
                AND c.teacher_id = auth.uid()
            )
            -- Add specific checks for which fields can be updated, e.g., only 'status'
        );
    */
    ```

## Data Access (e.g., `tasks`, `schedules` for students in a class)

Teachers need to see data for students enrolled in their classes.

1.  **Teachers can view data of students in their approved classes (example for `tasks`):**
    ```sql
    CREATE POLICY "teachers_can_view_tasks_of_students_in_their_classes" ON tasks
        FOR SELECT USING (
            EXISTS (
                SELECT 1
                FROM student_class_enrollments sce
                JOIN classes c ON sce.class_id = c.id
                WHERE c.teacher_id = auth.uid()      -- Teacher owns the class
                AND sce.student_id = tasks.user_id -- Task belongs to a student in that class
                AND sce.status = 'approved'
            )
        );
    ```
    *This policy would be replicated for other tables like `schedules`, `moods`, `equipment`, `rewards`, `house_chores`, adjusting `tasks.user_id` to the correct student foreign key column in each table.*

---
Remember to apply these policies to your Supabase database. Adjust foreign key names and column names as per your exact schema.

## RLS Policies for Class Tasks (`tasks` table)

These policies address how students view tasks assigned to their classes and how teachers create these tasks. The `tasks` table should have a `class_id` column (UUID, nullable, references `classes.id`) and a `type` column (e.g., 'personal', 'class').

### 1. Students Viewing Class Tasks

Students should be able to view tasks assigned to classes they are enrolled in, in addition to their personal tasks (which are typically covered by a policy like `tasks.user_id = auth.uid()`).

```sql
-- Students can view tasks for classes they are enrolled in (approved status)
CREATE POLICY "students_can_view_their_class_tasks" ON tasks
    FOR SELECT USING (
        type = 'class' AND class_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM student_class_enrollments sce
            WHERE sce.student_id = auth.uid()
            AND sce.class_id = tasks.class_id
            AND sce.status = 'approved'
        )
    );
```
*Note: This policy should be combined with existing SELECT policies on the `tasks` table. For example, if a user can see tasks where `tasks.user_id = auth.uid()`, the overall SELECT rule would be `(tasks.user_id = auth.uid()) OR (condition_for_class_tasks) OR (condition_for_shared_tasks_by_parents) etc.` Supabase combines multiple `USING` conditions for `SELECT` policies with `OR`.*

### 2. Teachers Creating Class Tasks

Teachers need permission to insert tasks that are designated as `type = 'class'` and linked to one of their classes via `class_id`. The `user_id` on such tasks would typically be the teacher's own ID (as the creator/assigner).

The existing general policy for inserting tasks is often:
`CREATE POLICY "users_can_insert_own_tasks" ON tasks FOR INSERT WITH CHECK (auth.uid() = user_id);`

This policy needs to be either replaced with a more comprehensive one or augmented. Here's a new, more specific policy for teachers creating class tasks:

```sql
-- Teachers can create class tasks for their classes
CREATE POLICY "teachers_can_create_class_tasks" ON tasks
    FOR INSERT WITH CHECK (
        ( -- Personal tasks for themselves (if they also use the system for personal tasks)
          auth.uid() = user_id AND (type = 'personal' OR type IS NULL)
          AND (SELECT role FROM user_roles WHERE user_id = auth.uid() AND role = 'teacher' LIMIT 1) IS NOT NULL
        ) 
        OR 
        ( -- Class tasks for one of their classes
          auth.uid() = user_id -- Task user_id is the teacher creating/assigning it
          AND type = 'class' 
          AND class_id IS NOT NULL
          AND (SELECT role FROM user_roles WHERE user_id = auth.uid() AND role = 'teacher' LIMIT 1) IS NOT NULL
          AND EXISTS ( -- Check teacher owns the class
              SELECT 1 FROM classes c
              WHERE c.id = tasks.class_id
              AND c.teacher_id = auth.uid()
          )
        )
    );
```

**Important Consideration for Task Insertion Policies:**

If you add the `teachers_can_create_class_tasks` policy, you **must** review your existing INSERT policies for the `tasks` table.
*   If you have a general `users_can_insert_own_tasks` policy like the one mentioned above, it might conflict or need adjustment.
*   **Option 1 (Recommended): Modify the existing policy.**
    If you have `users_can_insert_own_tasks`, alter it to be more comprehensive:
    ```sql
    /*
    ALTER POLICY "users_can_insert_own_tasks" ON tasks
      WITH CHECK (
        ( -- Regular users (including students, parents) can insert personal tasks for themselves
          auth.uid() = user_id AND (type IS NULL OR type = 'personal')
        )
        OR
        ( -- Teachers can insert personal tasks OR class tasks
          auth.uid() = user_id -- Teacher is the task owner/creator
          AND (SELECT role FROM user_roles WHERE user_id = auth.uid() AND role = 'teacher' LIMIT 1) IS NOT NULL
          AND (
            (type IS NULL OR type = 'personal') -- Teacher's personal task
            OR
            ( -- Teacher's class task
              type = 'class'
              AND class_id IS NOT NULL
              AND EXISTS (
                  SELECT 1 FROM classes c
                  WHERE c.id = tasks.class_id
                  AND c.teacher_id = auth.uid()
              )
            )
          )
        )
      );
    */
    ```
*   **Option 2: Multiple Specific Policies.**
    If you prefer separate policies, ensure the conditions are mutually exclusive or work together correctly. For instance, you might have one policy for students creating personal tasks, and `teachers_can_create_class_tasks` for teachers. Be careful that a non-teacher cannot accidentally satisfy parts of the teacher policy.

For the purpose of this documentation update, the `teachers_can_create_class_tasks` policy is provided. Database administrators should carefully review and integrate this with their existing RLS setup for the `tasks` table to avoid conflicts and ensure correct permissions.
