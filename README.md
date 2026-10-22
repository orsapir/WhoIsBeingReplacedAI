# מי יוחלף קודם על ידי AI?

משחק רשת אינסופי בעברית. בכל סיבוב מוצגים שני מקצועות, והשחקן בוחר מי מהם בסיכון גבוה יותר להיות מוחלף על ידי מחשוב ו-AI. התשובה נקבעת לפי נתוני מחקר אמיתיים.

## איך משחקים

- לוחצים על הכפתור האדום או הכחול, לפי המקצוע שלדעתכם יוחלף קודם (במקלדת: חץ ימינה לאדום, חץ שמאלה לכחול).
- אחרי הבחירה מוצגים האחוזים של שני המקצועות, והמקצוע שבסיכון הגבוה יותר מקבל תגית ״יוחלף קודם״.
- המשחק לא נגמר. כל תשובה נכונה מאריכה את הרצף, וכל 3 תשובות נכונות ברצף מעלות רמה. ברמות הגבוהות הפער בין שני המקצועות קטן יותר. טעות מאפסת את הרצף, והמשחק ממשיך.
- התוצאה והשיא נשמרים בדפדפן.

## מקורות הנתונים

| מה | מקור | שימוש במשחק |
|---|---|---|
| הסתברות למחשוב של 702 מקצועות | Carl Benedikt Frey & Michael A. Osborne, *The Future of Employment: How Susceptible Are Jobs to Computerisation?*, Oxford Martin School, 2013. גרסת כתב העת: *Technological Forecasting and Social Change* 114 (2017), [doi:10.1016/j.techfore.2016.08.019](https://doi.org/10.1016/j.techfore.2016.08.019) | קובע את התשובה הנכונה |
| ציון התאמה ל-AI יוצר לפי מקצוע | Kiran Tomlinson, Sonia Jaffe, Will Wang, Scott Counts, Siddharth Suri, *Working with AI: Measuring the Applicability of Generative AI to Occupations*, Microsoft Research, 2025, [arXiv:2507.07935](https://arxiv.org/abs/2507.07935). הנתונים: [microsoft/working-with-ai](https://github.com/microsoft/working-with-ai), גרסה v1.1, ברישיון CC BY 4.0 | מוצג כמידע משלים בלבד |

הערות:

- שני המחקרים מתייחסים לשוק העבודה בארה״ב ומשתמשים בסיווג המקצועות האמריקאי SOC. בכל כרטיס מופיע גם שם המקצוע המקורי באנגלית. השמות בעברית הם תרגום שלנו, וקוד ה-SOC של כל מקצוע מופיע ב-`data/jobs_he.psv`.
- המחקר של Frey & Osborne משתמש בקודי SOC 2010, ושל Microsoft בקודי SOC 2018. כשקוד השתנה בין הגרסאות, הקובץ `data/jobs_he.psv` מציין במפורש את הקוד המקביל. בשלושה מקצועות אין מקבילה אחת-לאחת (רופאים, מרצים באוניברסיטה, והקבוצה המשולבת של אנליסטי סייבר ומפתחי ווב), ולכן הציון של Microsoft לא מוצג בהם.
- החוקרים של Microsoft מדגישים שהציון שלהם לא מודד יכולת להחליף עובדים. לכן הוא לא משפיע על הניקוד, ומוצג רק כהערה מתחת לתשובה כשיש פער ברור בין שני המקצועות.
- הקובץ `data/sources/frey_osborne_2013.csv` הוא העתק של טבלת הנספח מהמאמר, כפי שפורסמה ב-[plotly/datasets](https://github.com/plotly/datasets/blob/master/job-automation-probability.csv). סקריפט הבנייה מוודא שיש בו בדיוק 702 מקצועות. הדירוגים 1 עד 702 מלאים וההסתברויות עולות לפי הדירוג. בשורה של קוד 29-1081 (Podiatrists) שם המקצוע בקובץ שגוי, והמקצוע הזה לא נכלל במשחק.

## מבנה הפרויקט

```
.github/workflows/pages.yml  פרסום אוטומטי ל-GitHub Pages
index.html                 הדף
assets/style.css           עיצוב
assets/game.js             לוגיקת המשחק
assets/jobs.js             נתוני המקצועות (נוצר אוטומטית, לא לערוך ידנית)
data/jobs_he.psv           רשימת המקצועות שנבחרו: קוד SOC, שם בעברית, אימוג׳י
data/sources/              קובצי המקור של שני המחקרים
scripts/build_data.py      בונה את assets/jobs.js מהקבצים שלמעלה
```

## הרצה מקומית

האתר סטטי לגמרי, בלי שלב בנייה ובלי תלויות. אפשר לפתוח את `index.html` ישירות בדפדפן, או להריץ שרת מקומי:

```sh
python3 -m http.server 8000
# ואז לגלוש אל http://localhost:8000
```

## עדכון רשימת המקצועות

1. עורכים את `data/jobs_he.psv`. כל שורה היא `soc_2010|ms_soc|emoji|שם בעברית`. שדה `ms_soc` ריק פירושו אותו קוד, ו-`-` פירושו שאין מקבילה בנתוני Microsoft.
2. מריצים:

   ```sh
   python3 scripts/build_data.py          # כותב את assets/jobs.js
   python3 scripts/build_data.py --check  # מדפיס גם כל מקצוע מול השמות במקורות, לבדיקה
   ```

הסקריפט עוצר עם הודעת שגיאה אם קוד לא קיים באחד המקורות או מופיע פעמיים.

## פרסום ב-GitHub Pages

הקובץ `.github/workflows/pages.yml` מפרסם את האתר אוטומטית בכל push לענף הראשי. הוא בודק ש-`assets/jobs.js` תואם לנתוני המקור, ומעלה רק את `index.html` ואת התיקייה `assets/`.

הפעלה חד-פעמית: ב-Settings → Pages בוחרים ב-Source את האפשרות **GitHub Actions**. אחר כך מריצים מחדש את ה-workflow (או דוחפים commit). הכתובת תהיה https://orsapir.github.io/WhoIsBeingReplacedAI/.

GitHub Pages זמין למאגר פרטי רק בחשבון בתשלום (Pro, Team או Enterprise). בחשבון חינמי צריך להפוך את המאגר לציבורי.

---

## English summary

An endless Hebrew web game: two occupations per round, pick the one more likely to be replaced by computerisation/AI. The answer comes from Frey & Osborne's (Oxford, 2013) probability of computerisation for 702 US occupations. Each card also shows Microsoft Research's 2025 generative-AI applicability score as context only. The site is static (`index.html` + `assets/`). `scripts/build_data.py` regenerates `assets/jobs.js` from the curated list in `data/jobs_he.psv` and the source datasets in `data/sources/`.
