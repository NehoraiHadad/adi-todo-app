# הודעות למשתמש: כללים ונוהל קבוע

מדריך זה מתאר את הסטנדרטים לתצוגת הודעות למשתמש באפליקציית "תזכירון של עדי".

## עקרונות כלליים

1. כל ההודעות למשתמש יוצגו בעברית מלאה
2. ההודעות צריכות להיות קצרות, ברורות וידידותיות לילדים
3. יש להשתמש ב-`notifications` מהקובץ `src/components/ui/notifications.tsx` 
4. כל הודעות הצלחה, שגיאה או הודעות אינפורמטיביות חייבות להיות אחידות בכל המערכת

## סוגי הודעות

קיימים 4 סוגי הודעות בסיסיים:

1. **הודעות הצלחה** - `notifications.success()`
2. **הודעות שגיאה** - `notifications.error()`
3. **הודעות מידע** - `notifications.info()`
4. **הודעות טעינה** - `notifications.loading()`

## שימוש בטקסטים קבועים

כדי לשמור על אחידות, אנחנו משתמשים ב־`notificationMessages` שמאפשר לבנות הודעות בפורמט אחיד:

```typescript
// הודעת הצלחה ביצירה
notifications.success(notificationMessages.create.success("המשימה"), {
  title: notificationMessages.create.title
});

// הודעת שגיאה בעדכון
notifications.error(notificationMessages.error.update("מערכת הלימודים"), {
  title: "אופס! משהו השתבש"
});

// הודעת טעינה
const loadingId = notifications.loading(notificationMessages.loading.save("מערכת לימודים"));
// כאשר הטעינה מסתיימת
notifications.dismiss(loadingId);
```

## פעולות ותבניות קבועות

אלה הפעולות הקבועות שיש להשתמש בהן:

| פעולה | תיאור | דוגמה |
|-------|-------|-------|
| `create` | יצירת פריט חדש | `notificationMessages.create.success("המשימה")` |
| `update` | עדכון פריט קיים | `notificationMessages.update.success("השיעור")` |
| `delete` | מחיקת פריט | `notificationMessages.delete.success("המטלה")` |
| `save` | שמירת מידע | `notificationMessages.save.success("מערכת הלימודים")` |
| `load` | טעינת מידע | `notificationMessages.loading.load("משימות")` |

## דוגמאות

### יצירת משימה:

```typescript
// בעת יצירה
const loadingId = notifications.loading(notificationMessages.loading.create("המשימה"));

// לאחר הצלחה
notifications.dismiss(loadingId);
notifications.success(notificationMessages.create.success("המשימה"), {
  title: notificationMessages.create.title
});

// במקרה של שגיאה
notifications.dismiss(loadingId);
notifications.error(notificationMessages.error.create("המשימה"), {
  title: "אופס! משהו השתבש"
});
```

### עדכון פריט:

```typescript
// בעת עדכון
const loadingId = notifications.loading(notificationMessages.loading.update("פרטי המשתמש"));

// לאחר הצלחה
notifications.dismiss(loadingId);
notifications.success(notificationMessages.update.success("פרטי המשתמש"), {
  title: notificationMessages.update.title
});
```

## התאמות מיוחדות

למרות הסטנדרטיזציה, ניתן להתאים הודעות למקרים מיוחדים:

```typescript
// הודעה עם משך זמן מותאם אישית (מילישניות)
notifications.success("פעולה מוצלחת!", { duration: 1500 });

// הודעה עם כותרת מותאמת אישית
notifications.success("המשימה הושלמה!", { title: "כל הכבוד! 🎉" });
``` 