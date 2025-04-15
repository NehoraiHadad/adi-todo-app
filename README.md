# ClassDigitalApp - אפליקציית כיתה דיגיטלית

אפליקציית ווב כיתתית לניהול משימות, מערכת שעות, ציוד יומי, ותורנויות בית.

## תכונות מרכזיות

- תמיכה מלאה בעברית (RTL)
- רספונסיביות מלאה לטלפונים, טאבלטים ומחשבים
- לוח מחוונים יומי
- ניהול משימות (אישיות וכיתתיות)
- מערכת שעות אינטראקטיבית
- ניהול ציוד יומי
- תורנויות בית
- מערכת פרסים
- מעקב אחר מצב רוח יומי
- הודעות יומיות
- ממשק משתמש נגיש וידידותי לילדים

## טכנולוגיות

- **Frontend**: Next.js + Tailwind CSS
- **UI Components**: shadcn/ui
- **Backend**: Supabase (אימות, DB, עדכונים בזמן אמת)
- **State Management**: Zustand
- **קליינט צד שרת**: SWR

## ממשק משתמש (UI)

הפרויקט משתמש ב-[shadcn/ui](https://ui.shadcn.com/) - ספריית רכיבים איכותית ונגישה המבוססת על Radix UI ו-Tailwind CSS. הרכיבים הבאים שולבו באפליקציה:

- **Card**: לתצוגת כרטיסיות מידע ופעולות
- **Button**: כפתורים בסגנונות שונים
- **Avatar**: לייצוג משתמשים
- **Badge**: לציון סטטוסים ותגיות
- **Tabs**: למיון וסינון תוכן

יתרונות השימוש ב-shadcn/ui:
- עיצוב עקבי ומודרני
- נגישות מובנית (a11y)
- תמיכה בדפי RTL
- אנימציות חלקות ומהירות תגובה
- סגנון המותאם במיוחד לילדים עם צבעים ורגשות מובעים

## התקנה והפעלה

### דרישות מוקדמות

- Node.js (גרסה 18 ומעלה)
- npm, yarn או pnpm
- חשבון Supabase (אופציונלי לפיתוח מקומי ללא backend)

### מערכת אימות (Authentication)

האפליקציה משתמשת במערכת אימות מבוססת שם משתמש וסיסמה, המותאמת במיוחד לילדים:

- **אימות פשוט**: משתמשים נרשמים עם שם משתמש וסיסמה בלבד (ללא צורך בדוא"ל)
- **ממשק ידידותי לילדים**: טפסי התחברות והרשמה בעברית עם הנחיות ברורות
- **הגנת מידע**: מאחורי הקלעים, המערכת יוצרת כתובת דוא"ל וירטואלית עבור כל משתמש במבנה `username@classdigital.app`
- **פרופיל אישי**: שם המשתמש המקורי נשמר כשם תצוגה בפרופיל

יתרונות שיטה זו:
- פשטות שימוש לילדים צעירים
- אין צורך במעורבות הורים לאימות דוא"ל
- הגנה על פרטיות המשתמשים הצעירים
- תואם את דרישות Supabase לאימות

### שלבי התקנה

1. שכפל את הפרויקט:

```bash
git clone <repository-url>
cd adi-project
```

2. התקן תלויות:

```bash
npm install
# או
yarn install
# או
pnpm install
```

3. הגדר קונפיגורציית Supabase:
   - צור חשבון ב-[Supabase](https://supabase.io/)
   - צור פרויקט חדש
   - העתק את `.env.local.example` ל-`.env.local`
   - מלא את פרטי ה-URL ו-API key של Supabase בקובץ ה-`.env.local`

4. הפעל את הפרויקט במצב פיתוח:

```bash
npm run dev
# או
yarn dev
# או
pnpm dev
```

כעת האפליקציה זמינה בכתובת [http://localhost:3000](http://localhost:3000)

## פיתוח

### מבנה הפרויקט

```
adi-project/
├── src/
│   ├── app/                   # App router routes
│   ├── components/            # UI components
│   │   ├── ui/                # shadcn/ui components
│   │   └── ...                # Custom components
│   ├── lib/                   # Utility libraries
│   │   ├── utils.ts           # Helper utilities
│   │   └── supabase/          # Supabase client
│   ├── store/                 # Zustand state management
│   └── types/                 # TypeScript definitions
├── public/                    # Static assets
├── components.json            # shadcn/ui configuration
└── .env.local                 # Environment variables
```

### התאמה אישית של רכיבי shadcn/ui

ניתן להתאים את רכיבי shadcn/ui על ידי עריכת הקבצים בתיקיית `src/components/ui`. שינויים בקובץ `tailwind.config.js` ישפיעו על הנושא הכללי.

מוסף להתאמות בטיילווינד, הפרויקט כולל את התוספות הבאות:
- תמיכה בכיווניות RTL
- שילוב אמוג'י ואייקונים ידידותיים לילדים
- סגנון צבעוני ומותאם לגילאי 8-11

## הערות פיתוח

### סכמת מסד הנתונים

הפרויקט משתמש במספר טבלאות במסד הנתונים:

- **users**: מידע אודות המשתמשים
- **schedule**: מערכת שעות
- **tasks**: משימות (אישיות וכיתתיות)
- **mood**: מעקב אחר מצב רוח
- **daily_messages**: הודעות יומיות
- **rewards**: פרסים
- **equipment**: ציוד יומי
- **house_chores**: תורנויות בית

ראה הגדרות טיפוסים ב-`src/types/index.ts` למבנה מפורט.

## הוספת רכיבי shadcn/ui נוספים

להוספת רכיבים חדשים מ-shadcn/ui, השתמש בפקודה:

```bash
npx shadcn@latest add [component-name]
# לדוגמה:
npx shadcn@latest add dropdown-menu
```

## רישיון

כל הזכויות שמורות.
