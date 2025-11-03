# הוספת שירותים חיצוניים

מדריך להוספת חיבורים לאיירטייבל, פיירבייס ושירותים נוספים.

## הוספת Airtable

### 1. התקנת Dependency

```bash
npm install airtable
```

### 2. יצירת Service

צור קובץ `src/lib/services/airtable.ts`:

```typescript
import Airtable from 'airtable';

const base = new Airtable({
  apiKey: process.env.AIRTABLE_API_KEY
}).base(process.env.AIRTABLE_BASE_ID!);

export async function fetchProducts() {
  try {
    const records = await base('Products').select().all();
    return records.map(record => ({
      id: record.id,
      name: record.get('Name') as string,
      price: record.get('Price') as number,
      details: record.get('Details') as string,
    }));
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

export async function saveQuote(quoteData: any) {
  try {
    const record = await base('Quotes').create({
      'Customer Name': quoteData.customerName,
      'Quote Number': quoteData.quoteNumber,
      'Budget': quoteData.budgetBeforeVAT,
      'Status': 'Draft'
    });
    return record.id;
  } catch (error) {
    console.error('Error saving quote:', error);
    throw error;
  }
}
```

### 3. הוספת משתני סביבה

צור קובץ `.env.local`:

```
AIRTABLE_API_KEY=your_api_key_here
AIRTABLE_BASE_ID=your_base_id_here
```

### 4. יצירת API Route

צור קובץ `src/app/api/products/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { fetchProducts } from '@/lib/services/airtable';

export async function GET() {
  try {
    const products = await fetchProducts();
    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
```

### 5. יצירת Hook לטעינת מוצרים

צור קובץ `src/hooks/useProducts.ts`:

```typescript
import { useState, useEffect } from 'react';
import { Product } from '@/types';

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProducts() {
      try {
        setLoading(true);
        const response = await fetch('/api/products');
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        setProducts(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, []);

  return { products, loading, error };
}
```

### 6. שימוש בקומפוננט

עדכן את `ProductSidebar`:

```typescript
import { useProducts } from '@/hooks/useProducts';

export function ProductSidebar() {
  const { products, loading, error } = useProducts();

  if (loading) return <div>טוען מוצרים...</div>;
  if (error) return <div>שגיאה: {error}</div>;

  // שימוש ב-products...
}
```

## הוספת Firebase

### 1. התקנת Dependencies

```bash
npm install firebase
```

### 2. יצירת Service

צור קובץ `src/lib/services/firebase.ts`:

```typescript
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

const firebaseConfig = {
  // התצורה שלך
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export async function saveQuoteToFirebase(quoteData: any) {
  try {
    await setDoc(doc(db, 'quotes', quoteData.id), quoteData);
    return true;
  } catch (error) {
    console.error('Error saving to Firebase:', error);
    throw error;
  }
}

export async function getQuoteFromFirebase(quoteId: string) {
  try {
    const docRef = doc(db, 'quotes', quoteId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error fetching from Firebase:', error);
    throw error;
  }
}
```

## הוספת תכונות נוספות

### שמירה אוטומטית

```typescript
// src/hooks/useAutoSave.ts
import { useEffect, useRef } from 'react';
import { QuoteData } from '@/types';

export function useAutoSave(
  quoteData: QuoteData | null,
  saveFunction: (data: QuoteData) => Promise<void>,
  interval: number = 30000 // 30 שניות
) {
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!quoteData) return;

    intervalRef.current = setInterval(async () => {
      try {
        await saveFunction(quoteData);
        console.log('Auto-save completed');
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [quoteData, saveFunction, interval]);
}
```

### חישובים מתקדמים

```typescript
// src/lib/calculations.ts
import { QuoteOption, QuoteData } from '@/types';

export function calculateOptionFinancials(
  option: QuoteOption, 
  quoteData: QuoteData
): QuoteOption {
  const packagingCost = option.items
    .filter(item => item.type === 'packaging')
    .reduce((sum, item) => sum + (item.price || 0), 0);

  const productsCost = option.items
    .filter(item => item.type === 'product')
    .reduce((sum, item) => sum + (item.price || 0), 0);

  const totalCost = packagingCost + productsCost;
  const profit = (quoteData.budgetBeforeVAT || 0) - totalCost;
  const profitPercentage = quoteData.budgetBeforeVAT 
    ? (profit / quoteData.budgetBeforeVAT) * 100 
    : 0;

  return {
    ...option,
    packagingItemsCost: packagingCost,
    productsCost,
    total: totalCost,
    actualProfit: profit,
    actualProfitPercentage: profitPercentage,
  };
}
```

## עצות לפיתוח

1. **התחל קטן**: הוסף תכונה אחת בכל פעם
2. **בדוק היטב**: וודא שכל תכונה עובדת לפני המעבר הבא
3. **שמור על מודולריות**: כל שירות בקובץ נפרד
4. **טפל בשגיאות**: תמיד הוסף try-catch ומסרי שגיאה ברורים
5. **תיעוד**: עדכן את ה-README כשמוסיפים תכונות חדשות