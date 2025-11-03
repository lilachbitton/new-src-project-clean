# מדריך מעבר מהפרויקט הישן

המדריך הזה יעזור לך להעביר את החיבורים והתכונות החשובות מהפרויקט הישן לחדש.

## שלב 1: העתקת קבצי שירותים

### העתק את קבצי ה-lib מהפרויקט הישן:

```bash
# מהפרויקט הישן
cp src/lib/airtable.ts ../new-src-project-clean/src/lib/services/
cp src/lib/firebase-helpers.ts ../new-src-project-clean/src/lib/services/
cp src/lib/firebase.ts ../new-src-project-clean/src/lib/services/
```

### עדכן את ה-imports בקבצים החדשים:

```typescript
// במקום:
import { base } from "@/lib/airtable";

// השתמש ב:
import { base } from "@/lib/services/airtable";
```

## שלב 2: העתקת משתני סביבה

העתק את קובץ `.env.local` מהפרויקט הישן:

```bash
cp .env.local ../new-src-project-clean/
```

## שלב 3: הוספת Dependencies

הוסף את ה-dependencies החסרים לפרויקט החדש:

```bash
cd new-src-project-clean
npm install airtable firebase axios jspdf html2canvas
```

## שלב 4: יצירת API Routes

צור את ה-API routes הנחוצים:

### src/app/api/save-quote/route.ts
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { saveQuoteToFirebase } from '@/lib/services/firebase-helpers';

export async function POST(request: NextRequest) {
  try {
    const quoteData = await request.json();
    await saveQuoteToFirebase(quoteData);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to save quote' },
      { status: 500 }
    );
  }
}
```

### src/app/api/products/route.ts
```typescript
import { NextResponse } from 'next/server';
import { fetchProductsByCatalog } from '@/lib/services/airtable';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const catalogId = searchParams.get('catalogId');
    
    if (!catalogId) {
      return NextResponse.json(
        { error: 'Catalog ID is required' },
        { status: 400 }
      );
    }

    const products = await fetchProductsByCatalog(catalogId);
    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
```

## שלב 5: עדכון הקומפוננטות

### עדכן את ProductSidebar לטעון מוצרים אמיתיים:

```typescript
// src/components/quote-builder/ProductSidebar.tsx
import { useState, useEffect } from 'react';

export function ProductSidebar() {
  const [products, setProducts] = useState([]);
  const [catalogId, setCatalogId] = useState('');

  useEffect(() => {
    if (catalogId) {
      fetch(`/api/products?catalogId=${catalogId}`)
        .then(res => res.json())
        .then(setProducts)
        .catch(console.error);
    }
  }, [catalogId]);

  // שאר הקוד...
}
```

### עדכן את QuoteActions לשמירה אמיתית:

```typescript
// src/components/quote-builder/QuoteActions.tsx
export function QuoteActions({ quoteData, onSave, onSend }) {
  const handleSave = async () => {
    try {
      const response = await fetch('/api/save-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quoteData)
      });

      if (response.ok) {
        alert('ההצעה נשמרה בהצלחה!');
        onSave?.();
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      alert('שגיאה בשמירת ההצעה');
      console.error(error);
    }
  };

  // שאר הקוד...
}
```

## שלב 6: הוספת תכונות מתקדמות

### חישובים פיננסיים:

```typescript
// src/lib/calculations.ts
export function calculateAdditionalExpensesByBudget(budget: number): number {
  if (!budget) return 0;
  if (budget >= 45 && budget < 90) return 8;
  if (budget >= 90 && budget < 150) return 16;
  if (budget >= 150 && budget < 200) return 21;
  if (budget >= 200 && budget < 250) return 25;
  if (budget >= 250 && budget < 300) return 29;
  if (budget >= 300) return 33;
  return 0;
}

export function calculateOptionFinancials(
  option: QuoteOption, 
  quoteData: QuoteData
): QuoteOption {
  const itemCount = option.items.filter(item => item.type !== 'packaging').length;
  const hasBoxPackaging = option.items.some(
    item => item.type === 'packaging' && item.name.toLowerCase().includes('קופסת')
  );
  
  const packagingWorkCost = itemCount * 0.5 + (hasBoxPackaging ? 2 : 1);
  const productsCost = option.items
    .filter(item => item.type !== 'packaging' && item.price)
    .reduce((sum, item) => sum + (item.price || 0), 0);
  
  const additionalExpenses = calculateAdditionalExpensesByBudget(
    quoteData.budgetBeforeVAT || 0
  );

  return {
    ...option,
    packagingWorkCost,
    productsCost,
    additionalExpenses,
    // חישובים נוספים...
  };
}
```

### שמירה אוטומטית:

```typescript
// src/hooks/useAutoSave.ts
import { useEffect, useRef } from 'react';

export function useAutoSave(
  data: any,
  saveFunction: (data: any) => Promise<void>,
  interval = 60000 // דקה
) {
  const intervalRef = useRef<NodeJS.Timeout>();
  const lastSavedRef = useRef<string>('');

  useEffect(() => {
    if (!data) return;

    const dataString = JSON.stringify(data);
    
    intervalRef.current = setInterval(async () => {
      if (dataString !== lastSavedRef.current) {
        try {
          await saveFunction(data);
          lastSavedRef.current = dataString;
          console.log('Auto-save completed');
        } catch (error) {
          console.error('Auto-save failed:', error);
        }
      }
    }, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [data, saveFunction, interval]);
}
```

## שלב 7: בדיקות ופתרון בעיות

### 1. בדוק שהחיבורים עובדים:
```bash
npm run dev
```

### 2. פתח Console בדפדפן ובדוק שגיאות

### 3. בדוק שהנתונים נטענים נכון מ-Airtable

### 4. בדוק שהשמירה עובדת ל-Firebase

## בעיות נפוצות ופתרונות

### שגיאת CORS:
```typescript
// next.config.js
const nextConfig = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
        ],
      },
    ];
  },
};
```

### שגיאות TypeScript:
- וודא שכל ה-types מוגדרים ב-`src/types/index.ts`
- השתמש ב-`any` בשלב המעבר ואז חזור ותקן

### בעיות Performance:
- השתמש ב-`React.memo` לקומפוננטות כבדות
- השתמש ב-`useMemo` ו-`useCallback` לחישובים כבדים

## טיפים לפיתוח המשך

1. **התחל מהבסיס**: תחילה וודא שהממשק עובד ללא חיבורים חיצוניים
2. **הוסף בהדרגה**: כל חיבור או תכונה בנפרד
3. **בדוק תמיד**: לא תמשיך לשלב הבא עד שהנוכחי עובד
4. **שמור גיבויים**: לפני כל שינוי גדול
5. **תעד הכל**: רשום מה עשית ואיך

## מה חשוב לזכור

- **הפרויקט החדש הרבה יותר נקי ומהיר**
- **הקוד יותר קל לתחזוקה ופיתוח**
- **אפשר להוסיף תכונות חדשות בקלות**
- **המבנה המודולרי מאפשר עבודת צוות טובה יותר**

---

**בהצלחה במעבר! הקוד החדש הרבה יותר טוב ונקי מהישן.**