/**
 * כלי עזר לבדיקת קלט מהמשתמש
 * 
 * הקובץ הזה מכיל פונקציות פשוטות שעוזרות לנו לוודא שהמידע שהמשתמש מכניס הוא נכון ובטוח.
 * אנחנו משתמשים בהן גם בצד הלקוח וגם בצד השרת כדי להיות בטוחים פעמיים! 🔍🔍
 */

// בדיקה אם טקסט קיים ולא ריק
export const isValidText = (text: string | undefined | null): boolean => {
  return typeof text === 'string' && text.trim().length > 0;
};

// בדיקה אם טקסט באורך מתאים
export const isValidLength = (text: string | undefined | null, minLength: number, maxLength: number): boolean => {
  if (!isValidText(text)) return false;
  const length = text!.trim().length;
  return length >= minLength && length <= maxLength;
};

// בדיקה אם דואר אלקטרוני תקין
export const isValidEmail = (email: string | undefined | null): boolean => {
  if (!isValidText(email)) return false;
  // בדיקה בסיסית של מבנה אימייל - יש @ ולפחות נקודה אחת אחריה
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email!);
};

// Type for any value that could be a number
type NumberValue = string | number | null | undefined;

// בדיקה אם מספר תקין
export const isValidNumber = (value: NumberValue): boolean => {
  if (value === undefined || value === null) return false;
  return !isNaN(Number(value));
};

// בדיקה אם תאריך תקין
export const isValidDate = (dateString: string | undefined | null): boolean => {
  if (!isValidText(dateString)) return false;
  const date = new Date(dateString!);
  return !isNaN(date.getTime());
};

// בדיקה אם תאריך נמצא בעתיד
export const isFutureDate = (dateString: string | undefined | null): boolean => {
  if (!isValidDate(dateString)) return false;
  const date = new Date(dateString!);
  const now = new Date();
  // מאפס את השעה כדי להשוות רק את התאריך עצמו
  now.setHours(0, 0, 0, 0);
  return date >= now;
};

// בדיקה שהערך הוא בין מינימום למקסימום
export const isInRange = (value: number, min: number, max: number): boolean => {
  return value >= min && value <= max;
};

// Task interface
interface TaskInput {
  title?: string;
  due_date?: string;
}

// פונקציה מרכזית לבדיקת משימה
export const validateTask = (task: TaskInput): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};

  // חובה למלא כותרת
  if (!isValidText(task?.title)) {
    errors.title = 'חובה להוסיף כותרת למשימה';
  } else if (!isValidLength(task?.title, 3, 100)) {
    errors.title = 'כותרת המשימה חייבת להיות בין 3 ל-100 תווים';
  }

  // אם קיים תאריך יעד, בודקים שהוא תקין
  if (task?.due_date !== undefined && task?.due_date !== null && task?.due_date !== '') {
    if (!isValidDate(task.due_date)) {
      errors.due_date = 'תאריך לא תקין';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Schedule interface
interface ScheduleInput {
  title?: string;
  day_of_week?: number | string;
  start_time?: string;
  end_time?: string;
}

// פונקציה מרכזית לבדיקת מערכת שעות
export const validateSchedule = (schedule: ScheduleInput): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};

  // חובה למלא כותרת
  if (!isValidText(schedule?.title)) {
    errors.title = 'חובה להוסיף כותרת לשיעור';
  } else if (!isValidLength(schedule?.title, 2, 50)) {
    errors.title = 'כותרת השיעור חייבת להיות בין 2 ל-50 תווים';
  }

  // בדיקת יום בשבוע (0-6)
  if (schedule?.day_of_week === undefined || !isValidNumber(schedule.day_of_week)) {
    errors.day_of_week = 'חובה לבחור יום בשבוע';
  } else if (!isInRange(Number(schedule.day_of_week), 0, 6)) {
    errors.day_of_week = 'יום בשבוע חייב להיות בין 0 (ראשון) ל-6 (שבת)';
  }

  // בדיקת שעת התחלה
  if (!isValidText(schedule?.start_time)) {
    errors.start_time = 'חובה להזין שעת התחלה';
  }

  // בדיקת שעת סיום
  if (!isValidText(schedule?.end_time)) {
    errors.end_time = 'חובה להזין שעת סיום';
  }

  // בדיקה ששעת הסיום מאוחרת משעת ההתחלה
  if (isValidText(schedule?.start_time) && isValidText(schedule?.end_time)) {
    if (schedule.start_time! >= schedule.end_time!) {
      errors.end_time = 'שעת הסיום חייבת להיות מאוחרת משעת ההתחלה';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Message interface
interface ParentMessageInput {
  content?: string;
  user_id?: string;
}

// פונקציה מרכזית לבדיקת הודעה מההורים
export const validateParentMessage = (message: ParentMessageInput): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};

  // חובה למלא תוכן להודעה
  if (!isValidText(message?.content)) {
    errors.content = 'חובה להוסיף תוכן להודעה';
  } else if (!isValidLength(message?.content, 3, 500)) {
    errors.content = 'תוכן ההודעה חייב להיות בין 3 ל-500 תווים';
  }

  // חובה לציין למי ההודעה מיועדת
  if (!isValidText(message?.user_id)) {
    errors.user_id = 'חובה לבחור תלמיד/ה לשלוח אליו את ההודעה';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}; 