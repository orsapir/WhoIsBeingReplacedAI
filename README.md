# מי יוחלף קודם על ידי AI?

משחק רשת אינסופי בעברית. בכל סיבוב מוצגים שני מקצועות, והשחקן בוחר מי מהם בסיכון גבוה יותר להיות מוחלף על ידי מחשוב ו-AI. התשובה נקבעת לפי נתוני מחקר אמיתיים.

## איך משחקים

- לוחצים על המקצוע שלדעתכם יוחלף קודם (במקלדת: חץ ימינה או חץ שמאלה).
- אחרי הבחירה מוצגים האחוזים של שני המקצועות, והמקצוע שבסיכון הגבוה יותר מקבל חותמת ״יוחלף קודם״.
- המשחק לא נגמר. כל תשובה נכונה מאריכה את הרצף, וכל 3 תשובות נכונות ברצף מעלות רמה. ברמות הגבוהות הפער בין שני המקצועות קטן יותר. טעות מאפסת את הרצף, והמשחק ממשיך.
- התוצאה והשיא נשמרים בדפדפן.

## מקורות הנתונים

| מה | מקור | שימוש במשחק |
|---|---|---|
| הסתברות למחשוב של 702 מקצועות | Carl Benedikt Frey & Michael A. Osborne, *The Future of Employment: How Susceptible Are Jobs to Computerisation?*, Oxford Martin School, 2013. גרסת כתב העת: *Technological Forecasting and Social Change* 114 (2017), [doi:10.1016/j.techfore.2016.08.019](https://doi.org/10.1016/j.techfore.2016.08.019) | קובע את התשובה הנכונה |
| ציון התאמה ל-AI יוצר לפי מקצוע | Kiran Tomlinson, Sonia Jaffe, Will Wang, Scott Counts, Siddharth Suri, *Working with AI: Measuring the Applicability of Generative AI to Occupations*, Microsoft Research, 2025, [arXiv:2507.07935](https://arxiv.org/abs/2507.07935). הנתונים: [microsoft/working-with-ai](https://github.com/microsoft/working-with-ai), גרסה v1.1, ברישיון CC BY 4.0 | מוצג כמידע משלים בלבד |

הערות:

- שני המחקרים מתייחסים לשוק העבודה בארה״ב ומשתמשים בסיווג המקצועות האמריקאי SOC. בכל כרטיס מופיעים שם המקצוע המקורי באנגלית וקוד ה-SOC. השמות בעברית הם תרגום שלנו.
- המחקר של Frey & Osborne משתמש בקודי SOC 2010, ושל Microsoft בקודי SOC 2018. כשקוד השתנה בין הגרסאות, הקובץ `data/jobs_he.psv` מציין במפורש את הקוד המקביל. בשלושה מקצועות אין מקבילה אחת-לאחת (רופאים, מרצים באוניברסיטה, והקבוצה המשולבת של אנליסטי סייבר ומפתחי ווב), ולכן מוצג בהם ״אין התאמה ישירה״.
- החוקרים של Microsoft מדגישים שהציון שלהם לא מודד יכולת להחליף עובדים. לכן הוא לא משפיע על הניקוד.
- הקובץ `data/sources/frey_osborne_2013.csv` הוא העתק של טבלת הנספח מהמאמר, כפי שפורסמה ב-[plotly/datasets](https://github.com/plotly/datasets/blob/master/job-automation-probability.csv). סקריפט הבנייה מוודא שיש בו בדיוק 702 מקצועות. הדירוגים 1 עד 702 מלאים וההסתברויות עולות לפי הדירוג. בשורה של קוד 29-1081 (Podiatrists) שם המקצוע בקובץ שגוי, והמקצוע הזה לא נכלל במשחק.

## מבנה הפרויקט

```
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

ב-Settings → Pages בוחרים את הענף ואת תיקיית השורש (`/`). אין צורך בהגדרות נוספות.

---

## English summary

An endless Hebrew web game: two occupations per round, pick the one more likely to be replaced by computerisation/AI. The answer comes from Frey & Osborne's (Oxford, 2013) probability of computerisation for 702 US occupations. Each card also shows Microsoft Research's 2025 generative-AI applicability score as context only. The site is static (`index.html` + `assets/`). `scripts/build_data.py` regenerates `assets/jobs.js` from the curated list in `data/jobs_he.psv` and the source datasets in `data/sources/`.
