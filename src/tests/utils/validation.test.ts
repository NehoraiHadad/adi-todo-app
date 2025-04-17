import { 
  isValidText,
  isValidLength,
  isValidEmail,
  isValidNumber,
  isValidDate,
  validateTask,
  validateSchedule,
} from '@/utils/validation';

describe('בדיקות חברותיות למידע 🤔', () => {

  describe('isValidText - בדיקת טקסט תקין', () => {
    test('טקסט רגיל הוא תקין 📝', () => {
      expect(isValidText('שלום עולם')).toBe(true);
    });

    test('טקסט ריק לא תקין 🚫', () => {
      expect(isValidText('')).toBe(false);
    });

    test('רק רווחים לא נחשב לטקסט תקין 🚫', () => {
      expect(isValidText('   ')).toBe(false);
    });

    test('null ו-undefined לא תקינים 🚫', () => {
      expect(isValidText(null)).toBe(false);
      expect(isValidText(undefined)).toBe(false);
    });
  });

  describe('isValidLength - בדיקת אורך טקסט', () => {
    test('טקסט באורך נכון הוא תקין 📏', () => {
      expect(isValidLength('אבג', 2, 5)).toBe(true);
      expect(isValidLength('אבגדה', 2, 5)).toBe(true);
    });

    test('טקסט קצר מדי לא תקין 📏', () => {
      expect(isValidLength('א', 2, 5)).toBe(false);
    });

    test('טקסט ארוך מדי לא תקין 📏', () => {
      expect(isValidLength('אבגדהו', 2, 5)).toBe(false);
    });
  });

  describe('isValidEmail - בדיקת מייל', () => {
    test('כתובות מייל תקינות 📧', () => {
      expect(isValidEmail('adi@example.com')).toBe(true);
      expect(isValidEmail('teacher.name@school.edu.co.il')).toBe(true);
    });

    test('כתובות מייל לא תקינות 🚫', () => {
      expect(isValidEmail('not-an-email')).toBe(false);
      expect(isValidEmail('missing@domain')).toBe(false);
      expect(isValidEmail('@domain.com')).toBe(false);
    });
  });

  describe('isValidNumber - בדיקת מספרים', () => {
    test('מספרים כמספרים תקינים 🔢', () => {
      expect(isValidNumber(5)).toBe(true);
      expect(isValidNumber(0)).toBe(true);
      expect(isValidNumber(-10)).toBe(true);
    });

    test('מספרים כטקסט תקינים 🔢', () => {
      expect(isValidNumber('5')).toBe(true);
      expect(isValidNumber('0')).toBe(true);
      expect(isValidNumber('-10')).toBe(true);
    });

    test('ערכים שאינם מספרים לא תקינים 🚫', () => {
      expect(isValidNumber('hello')).toBe(false);
      expect(isValidNumber(null)).toBe(false);
      expect(isValidNumber(undefined)).toBe(false);
      expect(isValidNumber(NaN)).toBe(false);
    });
  });

  describe('isValidDate - בדיקת תאריכים', () => {
    test('תאריכים תקינים 📅', () => {
      expect(isValidDate('2023-05-15')).toBe(true);
      expect(isValidDate(new Date().toISOString())).toBe(true);
    });

    test('תאריכים לא תקינים 🚫', () => {
      expect(isValidDate('not-a-date')).toBe(false);
      expect(isValidDate('2023-15-50')).toBe(false);
      expect(isValidDate(null)).toBe(false);
    });
  });

  describe('validateTask - בדיקת משימה', () => {
    test('משימה תקינה עם תאריך יעד ✅', () => {
      const task = {
        title: 'להכין שיעורי בית',
        due_date: '2023-05-15',
      };
      
      const result = validateTask(task);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    test('משימה תקינה בלי תאריך יעד ✅', () => {
      const task = {
        title: 'להכין שיעורי בית',
      };
      
      const result = validateTask(task);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    test('משימה ללא כותרת לא תקינה 🚫', () => {
      const task = {
        due_date: '2023-05-15',
      };
      
      const result = validateTask(task);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveProperty('title');
    });

    test('משימה עם כותרת קצרה מדי לא תקינה 🚫', () => {
      const task = {
        title: 'א',
        due_date: '2023-05-15',
      };
      
      const result = validateTask(task);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveProperty('title');
    });
  });

  describe('validateSchedule - בדיקת מערכת לימודים', () => {
    test('מערכת לימודים תקינה ✅', () => {
      const schedule = {
        title: 'מתמטיקה',
        day_of_week: 1,
        start_time: '08:00',
        end_time: '09:30',
      };
      
      const result = validateSchedule(schedule);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    test('מערכת לימודים עם שעת סיום לפני שעת התחלה לא תקינה 🚫', () => {
      const schedule = {
        title: 'מתמטיקה',
        day_of_week: 1,
        start_time: '09:00',
        end_time: '08:00',
      };
      
      const result = validateSchedule(schedule);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveProperty('end_time');
    });

    test('מערכת לימודים ללא יום בשבוע לא תקינה 🚫', () => {
      const schedule = {
        title: 'מתמטיקה',
        start_time: '08:00',
        end_time: '09:30',
      };
      
      const result = validateSchedule(schedule);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveProperty('day_of_week');
    });
  });
}); 