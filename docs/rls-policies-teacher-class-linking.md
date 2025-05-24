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
```
