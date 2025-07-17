# שיפורי מערכת האימות והרשאות

## סקירה כללית

מסמך זה מתעד את השיפורים שבוצעו במערכת האימות והרשאות של האפליקציה, כולל תמיכה משופרת בשלושה סוגי משתמשים: ילדים, הורים ומורים.

## שינויים עיקריים

### 1. תיקון עקביות התפקידים (Role Consistency)

#### בעיה שזוהתה:
- אי-התאמה בין הקוד (`student/parent/teacher`) למסד הנתונים (`child/parent/teacher/admin`)
- הגדרות תפקידים סותרות בטבלאות שונות

#### פתרון שיושם:
- **עדכון enum UserRole** ב-`src/types/index.ts`:
  ```typescript
  export enum UserRole {
    CHILD = 'child',      // במקום STUDENT = 'student'
    PARENT = 'parent', 
    TEACHER = 'teacher',
    ADMIN = 'admin',
  }
  ```

- **מיגרציית מסד נתונים** (`fix_user_roles_consistency`):
  - עדכון ערכים קיימים מ-`student` ל-`child`
  - תיקון אילוצי בדיקה בטבלאות
  - הוספת אינדקסים לביצועים טובים יותר

### 2. ממשקים חדשים לניהול קשרים

נוספו ממשקי TypeScript חדשים ב-`src/types/index.ts`:

```typescript
// קשר הורה-ילד
interface ParentChildRelationship {
  parent_id: string;
  child_id: string;
  relationship_type: 'parent' | 'guardian';
  is_active: boolean;
}

// הגדרת כיתה
interface Class {
  name: string;
  grade?: string;
  school_year?: string;
  teacher_id?: string;
  is_active: boolean;
}

// קשר מורה-כיתה
interface TeacherClassRelationship {
  teacher_id: string;
  class_id: string;
  is_primary: boolean;
}

// משתמש עם קשרים
interface UserWithRelationships extends User {
  children?: Profile[];    // עבור הורים
  parents?: Profile[];     // עבור ילדים
  classes?: Class[];       // עבור מורים
  class?: Class;           // עבור תלמידים
}
```

### 3. פונקציות עזר למסד הנתונים

נוצר קובץ `src/utils/supabase/relationships.ts` עם פונקציות מתועדות:

#### ניהול קשרי הורה-ילד:
```typescript
// יצירת קשר הורה-ילד
createParentChildRelationship(parentId, childId, relationshipType)

// קבלת ילדים של הורה
getChildrenForParent(parentId)

// קבלת הורים של ילד
getParentsForChild(childId)

// אימות גישה של הורה לילד
validateParentChildAccess(parentId, childId)
```

#### ניהול קשרי מורה-כיתה:
```typescript
// הקצאת מורה לכיתה
assignTeacherToClass(teacherId, classId, isPrimary)

// קבלת כיתות של מורה
getClassesForTeacher(teacherId)

// רישום תלמיד לכיתה
enrollStudentInClass(studentId, classId)

// קבלת תלמידים בכיתה
getStudentsInClass(classId)

// אימות גישה של מורה לכיתה
validateTeacherClassAccess(teacherId, classId)
```

### 4. Middleware לאימות הרשאות

נוצר `src/middleware/auth-validation.ts` עם פונקציות מתועדות:

```typescript
// אימות אותנטיקציה בסיסי
validateAuthentication(request): Promise<User | null>

// אימות תפקיד
validateRole(user, allowedRoles): boolean

// אימות גישת הורה לילד
validateParentAccess(request, childId): Promise<boolean>

// אימות גישת מורה לכיתה
validateTeacherAccess(request, classId): Promise<boolean>

// אימות גישה כללי עם אפשרויות מרובות
validateAccess(request, options): Promise<boolean>
```

### 5. עדכון AuthContext

שיפור `src/context/AuthContext.tsx` כדי לכלול:
- **נתוני פרופיל מורחבים**: `profile`, `userRole`, `userWithRelationships`
- **טעינת קשרים אוטומטית** בהתאם לתפקיד המשתמש
- **פונקציית רענון**: `refreshProfile()` לעדכון נתונים

```typescript
type AuthContextType = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  userRole: UserRole | null;
  userWithRelationships: UserWithRelationships | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, username: string) => Promise<{ error: Error | null, data: any }>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<Session | null>;
  refreshProfile: () => Promise<void>;
};
```

### 6. Hook מותאם אישית להרשאות

נוצר `src/hooks/usePermissions.ts`:

```typescript
const { 
  permissions,      // אובייקט הרשאות מפורט
  canAccessChild,   // בדיקת גישה לילד
  canAccessClass,   // בדיקת גישה לכיתה
  canAccessParent,  // בדיקת גישה להורה
  canModify,        // בדיקת הרשאת עריכה
  canAccessAdmin,   // בדיקת גישה למנהל
  canCreate,        // בדיקת הרשאת יצירה
} = usePermissions();
```

### 7. קומפוננטות הגנה (Permission Guards)

נוצר `src/components/auth/PermissionGuard.tsx`:

#### קומפוננטה כללית:
```typescript
<PermissionGuard
  allowedRoles={[UserRole.PARENT]}
  childId={childId}
  fallback={<div>אין הרשאה</div>}
>
  <ChildDataComponent />
</PermissionGuard>
```

#### קומפוננטות מיוחדות:
```typescript
<ParentGuard childId={childId}>תוכן להורים</ParentGuard>
<TeacherGuard classId={classId}>תוכן למורים</TeacherGuard>
<ChildGuard targetUserId={userId}>תוכן לתלמידים</ChildGuard>
<AdminGuard>תוכן למנהלים</AdminGuard>
<AdultGuard>תוכן למבוגרים</AdultGuard>
<EducatorGuard>תוכן לחינוכיים</EducatorGuard>
```

### 8. API Routes מאובטחים

נוצרו דוגמאות ל-API routes עם הגנת הרשאות:

#### `/api/parent/children` - לניהול ילדים של הורה:
```typescript
// GET - קבלת רשימת ילדים
// POST - יצירת קשר הורה-ילד חדש
```

#### `/api/teacher/classes` - לניהול כיתות של מורה:
```typescript
// GET - קבלת רשימת כיתות (עם אפשרות לכלול תלמידים)
// POST - יצירת כיתה חדשה
```

#### `/api/child/profile` - לניהול פרופיל תלמיד:
```typescript
// GET - קבלת פרופיל תלמיד עם נתונים קשורים
// PATCH - עדכון פרופיל (עצמי או על ידי הורה)
```

### 9. עדכון Middleware הראשי

שיפור `src/middleware.ts`:
- תמיכה בתפקידים החדשים
- הגנה על נתיבים לפי תפקיד (`/parent/*`, `/teacher/*`)
- אימות מתקדם יותר עם אופטימיזציה

### 10. קומפוננטת Dashboard לפי תפקיד

נוצרה `src/components/dashboard/RoleDashboard.tsx`:
- **תצוגה מותאמת לכל תפקיד**
- **שימוש בכל רכיבי ההגנה החדשים**
- **הדגמה מעשית של המערכת**

## שיפורי אבטחה

### 1. Row Level Security (RLS)
- **אינדקסים חדשים** לביצועים טובים יותר
- **אימות זהות** בכל שכבות הגישה
- **הגנה על נתונים רגישים** ברמת מסד הנתונים

### 2. אימות שכבות (Layered Validation)
1. **Middleware ברמת הנתיב** - הגנה בסיסית
2. **API Route Validation** - אימות ברמת הבקשה
3. **Component Guards** - הגנה ברמת הממשק
4. **Hook Permissions** - בדיקות דינמיות

### 3. עקרון הרשאה מינימלית
- משתמשים רואים ויכולים לגשת **רק לנתונים הרלוונטיים** להם
- **הורים** - רק לנתוני ילדיהם
- **מורים** - רק לכיתות שלהם
- **ילדים** - רק לנתונים שלהם
- **מנהלים** - גישה מלאה עם אפשרות override

## דוגמאות שימוש

### דוגמה 1: הורה צופה בנתוני ילד
```typescript
const ParentChildView = ({ childId }: { childId: string }) => {
  return (
    <ParentGuard childId={childId} fallback={<div>אין הרשאה</div>}>
      <ChildTaskList childId={childId} />
      <ChildSchedule childId={childId} />
      <ChildMoodTracker childId={childId} />
    </ParentGuard>
  );
};
```

### דוגמה 2: מורה מנהל כיתה
```typescript
const TeacherClassManagement = ({ classId }: { classId: string }) => {
  return (
    <TeacherGuard classId={classId}>
      <ClassStudentList classId={classId} />
      <ClassTaskAssignment classId={classId} />
      <ClassScheduleManager classId={classId} />
    </TeacherGuard>
  );
};
```

### דוגמה 3: אימות ב-API Route
```typescript
export async function GET(request: NextRequest) {
  const hasAccess = await validateAccess(request, {
    allowedRoles: [UserRole.PARENT],
    childId: request.nextUrl.searchParams.get('childId'),
    allowAdmin: true
  });

  if (!hasAccess) {
    return unauthorizedResponse('אין הרשאה לגשת לנתוני ילד זה');
  }

  // המשך לוגיקת ה-API...
}
```

## הוראות הפעלה

### 1. התקנת התלות החדשות
```bash
# אם יש תלות חדשות - יבוצע אוטומטית עם הקוד הקיים
```

### 2. הפעלת המיגרציה
המיגרציה כבר הופעלה במסד הנתונים. אם יש צורך להפעיל שוב:
```sql
-- הופעל אוטומטית: fix_user_roles_consistency
```

### 3. עדכון קומפוננטות קיימות
כדי להשתמש בפונקציונליות החדשה:

```typescript
// במקום useAuth() בלבד:
const { user, session } = useAuth();

// השתמש גם ב:
const { user, session, userRole, userWithRelationships } = useAuth();
const { permissions, canAccessChild } = usePermissions();
```

### 4. הוספת הגנות לקומפוננטות חדשות
```typescript
import { ParentGuard, TeacherGuard, ChildGuard } from '@/components/auth/PermissionGuard';

// עטוף קומפוננטות רגישות בהגנות מתאימות
```

## בדיקות ואימות

### בדיקות שמומלץ לבצע:

1. **בדיקת תפקידים**:
   - התחברות עם משתמש ילד
   - התחברות עם משתמש הורה  
   - התחברות עם משתמש מורה
   - התחברות עם משתמש מנהל

2. **בדיקת הרשאות**:
   - הורה מנסה לגשת לילד שלא שלו
   - מורה מנסה לגשת לכיתה שלא שלו
   - ילד מנסה לגשת לנתוני ילד אחר

3. **בדיקת API**:
   - קריאות ל-`/api/parent/children`
   - קריאות ל-`/api/teacher/classes`
   - קריאות ל-`/api/child/profile`

4. **בדיקת ממשק**:
   - תצוגת dashboard שונה לכל תפקיד
   - הסתרה/הצגה של תוכן לפי הרשאות

## תמיכה ופתרון בעיות

### בעיות נפוצות:

1. **שגיאת "Unauthorized access"**:
   - בדוק שהמשתמש מחובר
   - בדוק שהתפקיד נכון במסד הנתונים
   - בדוק שהקשרים (parent-child/teacher-class) קיימים

2. **רכיב לא מוצג**:
   - בדוק את ה-PermissionGuard  
   - בדוק את ה-fallback component
   - בדוק את לוגיקת ההרשאות ב-usePermissions

3. **נתונים לא נטענים**:
   - בדוק את refreshProfile()
   - בדוק את הקשרים במסד הנתונים
   - בדוק שה-AuthContext מאותחל נכון

### לוגים לדיבוג:
הקוד כולל הרבה `console.error` statements לדיבוג. בפרודקשן, כדאי להסיר או להחליף במערכת לוגים מתקדמת יותר.

## מסקנות

השיפורים שבוצעו מספקים:
- ✅ **עקביות מלאה** בתפקידי המשתמשים
- ✅ **אבטחה משופרת** עם הגנה בשכבות מרובות  
- ✅ **קל לשימוש** עם hooks וקומפוננטות מוכנות
- ✅ **גמישות** למקרי שימוש מורכבים
- ✅ **תיעוד מקיף** לכל פונקציה ורכיב
- ✅ **מוכן לפרודקשן** עם טיפול בשגיאות

המערכת כעת תומכת באופן מלא בשלושת סוגי המשתמשים המבוקשים ומספקת תשתית איתנה להרחבות עתידיות.