# מדיניות אבטחת נתונים (RLS)

זה מסמך שמסביר איך אנחנו שומרים על המידע שלנו במערכת "תזכירון של עדי" בצורה בטוחה! 🔒

## מה זה RLS?

RLS = Row Level Security (אבטחה ברמת השורה).

זה אומר שכל שורה בטבלאות שלנו מוגנת ורק מי שמורשה יכול לראות או לשנות אותה. 
זה כמו שלכל תלמידה יש את המגירה הפרטית שלה בכיתה, ורק היא יכולה לפתוח אותה!

## מדיניות אבטחה לטבלאות

### טבלת פרופילים (`profiles`)

```sql
-- רק המשתמש יכול לראות ולעדכן את הפרופיל שלו
CREATE POLICY "user_can_view_own_profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "user_can_update_own_profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- רק משתמשים מחוברים יכולים ליצור פרופיל, והפרופיל חייב להיות שלהם
CREATE POLICY "users_can_create_own_profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);
```

### טבלת משימות (`tasks`)

```sql
-- משתמשים יכולים לראות רק את המשימות שלהם או משימות משותפות
CREATE POLICY "users_can_view_own_or_shared_tasks" ON tasks
    FOR SELECT USING (auth.uid() = user_id OR is_shared = true);

-- משתמשים יכולים לעדכן רק את המשימות שלהם
CREATE POLICY "users_can_update_own_tasks" ON tasks
    FOR UPDATE USING (auth.uid() = user_id);

-- משתמשים יכולים למחוק רק את המשימות שלהם
CREATE POLICY "users_can_delete_own_tasks" ON tasks
    FOR DELETE USING (auth.uid() = user_id);

-- משתמשים יכולים להוסיף משימות רק לעצמם
CREATE POLICY "users_can_insert_own_tasks" ON tasks
    FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### טבלת מערכת לימודים (`schedules`)

```sql
-- משתמשים יכולים לראות את המערכת שלהם ומערכות משותפות של הכיתה
CREATE POLICY "users_can_view_own_or_shared_schedules" ON schedules
    FOR SELECT USING (auth.uid() = user_id OR is_shared = true);

-- רק מורים (או הורים) יכולים ליצור מערכות משותפות
CREATE POLICY "admins_can_insert_shared_schedules" ON schedules
    FOR INSERT WITH CHECK (
        auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'admin')
        OR (auth.uid() = user_id AND is_shared = false)
    );

-- משתמשים יכולים לעדכן את המערכת האישית שלהם בלבד
CREATE POLICY "users_can_update_own_schedules" ON schedules
    FOR UPDATE USING (auth.uid() = user_id AND NOT is_shared);

-- רק מנהלים יכולים לעדכן מערכות משותפות
CREATE POLICY "admins_can_update_shared_schedules" ON schedules
    FOR UPDATE USING (
        auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'admin')
        AND is_shared
    );
```

### טבלת הודעות הורים (`parent_messages`)

```sql
-- משתמשים יכולים לראות רק את ההודעות שנשלחו אליהם
CREATE POLICY "users_can_view_their_messages" ON parent_messages
    FOR SELECT USING (auth.uid() = user_id);

-- רק מנהלים (הורים/מורים) יכולים ליצור הודעות
CREATE POLICY "admins_can_insert_messages" ON parent_messages
    FOR INSERT WITH CHECK (
        auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'admin')
    );

-- משתמשים יכולים לסמן את ההודעות שלהם כנקראו
CREATE POLICY "users_can_update_own_messages" ON parent_messages
    FOR UPDATE USING (
        auth.uid() = user_id AND 
        (OLD.is_read IS DISTINCT FROM NEW.is_read)
    );
```

### טבלת מצבי רוח (`moods`)

```sql
-- משתמשים יכולים לראות רק את מצבי הרוח שלהם
CREATE POLICY "users_can_view_own_moods" ON moods
    FOR SELECT USING (auth.uid() = user_id);

-- משתמשים יכולים להוסיף מצבי רוח רק לעצמם
CREATE POLICY "users_can_insert_own_moods" ON moods
    FOR INSERT WITH CHECK (auth.uid() = user_id);
```

## איך להפעיל את מדיניות האבטחה

המדיניות מופעלת אוטומטית כשמשתמשים ב-API שלנו. יש לנו גם נקודת קצה מיוחדת `/api/apply-rls-policies` שיכולה להפעיל את כל המדיניות בבת אחת אם צריך.

**חשוב לזכור**: כל פניה לשרת תעבור דרך ה-API שלנו, אף פעם לא ישירות ל-Supabase! 🚫 