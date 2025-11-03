import { NextRequest, NextResponse } from 'next/server';

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

// Table IDs
const QUOTES_TABLE = 'tbl9d2UhyRrNVjGxW'; // הצעות מחיר ללקוח
const OPTIONS_TABLE = 'tblkRYwCcYfEG6iAO'; // אופציות להצעת מחיר

export async function POST(request: NextRequest) {
  try {
    const quoteData = await request.json();
    
    console.log('💾 שומר הצעת מחיר:', quoteData.quoteNumber);
    console.log('🔍 Record ID:', quoteData.id);

    // בדוק אם יש Record ID תקין (מתחיל ב-rec)
    const isValidRecordId = quoteData.id && typeof quoteData.id === 'string' && quoteData.id.startsWith('rec');
    
    let quoteRecordId: string;

    // 1. צור או עדכן את הצעת המחיר
    const quoteFields: any = {};
    
    if (quoteData.customerName) quoteFields['שם לקוח'] = quoteData.customerName;
    if (quoteData.deliveryDate) quoteFields['תאריך אספקה'] = quoteData.deliveryDate;
    if (quoteData.packageQuantity !== undefined) quoteFields['כמות מארזים'] = quoteData.packageQuantity;
    if (quoteData.budgetPerPackage !== undefined) quoteFields['תקציב למארז'] = quoteData.budgetPerPackage;
    if (quoteData.agentCommission !== undefined) quoteFields['עמלת סוכן'] = quoteData.agentCommission / 100; // המרה לעשרוני
    if (quoteData.agent) quoteFields['סוכן'] = quoteData.agent;
    if (quoteData.customerPhone) quoteFields['מספר טלפון איש קשר'] = quoteData.customerPhone;
    if (quoteData.customerCard) quoteFields['גלוית לקוח'] = quoteData.customerCard;
    if (quoteData.customerSticker) quoteFields['מדבקת לקוח'] = quoteData.customerSticker;
    if (quoteData.customerNotes) quoteFields['איש קשר'] = quoteData.customerNotes;
    // הערה: "מספר הצעה" הוא שדה מחושב ב-Airtable ולא ניתן לעדכן אותו

    if (isValidRecordId) {
      // עדכן רשומה קיימת
      console.log('🔄 מעדכן הצעת מחיר קיימת:', quoteData.id);
      
      const quoteUpdateResponse = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${QUOTES_TABLE}/${quoteData.id}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${AIRTABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fields: quoteFields,
          }),
        }
      );

      if (!quoteUpdateResponse.ok) {
        const errorText = await quoteUpdateResponse.text();
        console.error('❌ Failed to update quote:', errorText);
        throw new Error(`Failed to update quote: ${quoteUpdateResponse.statusText}`);
      }

      quoteRecordId = quoteData.id;
      console.log('✅ הצעת מחיר עודכנה');
    } else {
      // צור רשומה חדשה
      console.log('➕ יוצר הצעת מחיר חדשה');
      
      const quoteCreateResponse = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${QUOTES_TABLE}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${AIRTABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fields: quoteFields,
          }),
        }
      );

      if (!quoteCreateResponse.ok) {
        const errorText = await quoteCreateResponse.text();
        console.error('❌ Failed to create quote:', errorText);
        throw new Error(`Failed to create quote: ${quoteCreateResponse.statusText}`);
      }

      const newQuote = await quoteCreateResponse.json();
      quoteRecordId = newQuote.id;
      console.log('✅ הצעת מחיר נוצרה:', quoteRecordId);
    }

    // 2. עדכן/צור אופציות
    const optionIds: string[] = [];
    
    for (const option of quoteData.options) {
      // אם יש airtableId תקין, זו אופציה קיימת - עדכן אותה
      if (option.airtableId && option.airtableId.startsWith('rec')) {
        const optionUpdateFields: any = {};
        
        // שדות בסיסיים (שניתן לערוך)
        if (option.title) optionUpdateFields['כותרת אופציה'] = option.title;
        if (option.id) optionUpdateFields['Option Letter'] = option.id;
        
        // משלוח
        if (option.shippingCost !== undefined) optionUpdateFields['תמחור משלוח ללקוח'] = option.shippingCost;
        if (option.deliveryCompany) optionUpdateFields['חברת משלוחים'] = option.deliveryCompany;
        if (option.deliveryBoxesCount !== undefined) optionUpdateFields['כמות קרטונים להובלה'] = option.deliveryBoxesCount?.toString();

        // מוצרים - זה השדה החשוב! קישור למוצרים
        if (option.items && option.items.length > 0) {
          const productIds = option.items
            .filter((item: any) => item.type === 'product' && item.id && item.id.startsWith('rec'))
            .map((item: any) => item.id);
          const packagingIds = option.items
            .filter((item: any) => item.type === 'packaging' && item.id && item.id.startsWith('rec'))
            .map((item: any) => item.id);
          
          if (productIds.length > 0) {
            optionUpdateFields['מוצרים'] = productIds;
          }
          if (packagingIds.length > 0) {
            optionUpdateFields['מוצרי אריזה ומיתוג copy'] = packagingIds;
          }
        }
        
        // הערה: השדות הבאים הם מחושבים ב-Airtable ולא ניתן לעדכן אותם:
        // - "עלות מוצרים" (מחושב מהמוצרים)
        // - "עלות מוצרי אריזה ומיתוג" (מחושב מהמוצרים)
        // - "תמחור לפרויקט לפני מע"מ" (כנראה מחושב)
        // - "packaging work cost" (כנראה מחושב)

        console.log(`🔄 מעדכן אופציה ${option.id}:`, optionUpdateFields);

        const optionUpdateResponse = await fetch(
          `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${OPTIONS_TABLE}/${option.airtableId}`,
          {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${AIRTABLE_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              fields: optionUpdateFields,
            }),
          }
        );

        if (!optionUpdateResponse.ok) {
          const errorText = await optionUpdateResponse.text();
          console.error(`❌ Failed to update option ${option.id}:`, errorText);
        } else {
          optionIds.push(option.airtableId);
          console.log(`✅ אופציה ${option.id} עודכנה`);
        }
      } else {
        // אופציה חדשה - צור אותה
        const newOptionFields: any = {
          'קישור להצעת מחיר': [quoteRecordId],
          'Option Letter': option.id,
          'כותרת אופציה': option.title || `אופציה ${option.id}`,
          'שם לקוח': quoteData.customerName || '',
        };
        
        // משלוח
        if (option.shippingCost !== undefined) newOptionFields['תמחור משלוח ללקוח'] = option.shippingCost;
        if (option.deliveryCompany) newOptionFields['חברת משלוחים'] = option.deliveryCompany;
        if (option.deliveryBoxesCount !== undefined) newOptionFields['כמות קרטונים להובלה'] = option.deliveryBoxesCount?.toString();

        // מוצרים - זה השדה החשוב!
        if (option.items && option.items.length > 0) {
          const productIds = option.items
            .filter((item: any) => item.type === 'product' && item.id && item.id.startsWith('rec'))
            .map((item: any) => item.id);
          const packagingIds = option.items
            .filter((item: any) => item.type === 'packaging' && item.id && item.id.startsWith('rec'))
            .map((item: any) => item.id);
          
          if (productIds.length > 0) {
            newOptionFields['מוצרים'] = productIds;
          }
          if (packagingIds.length > 0) {
            newOptionFields['מוצרי אריזה ומיתוג copy'] = packagingIds;
          }
        }
        
        // הערה: השדות הבאים הם מחושבים ב-Airtable ויחושבו אוטומטית:
        // - "עלות מוצרים"
        // - "עלות מוצרי אריזה ומיתוג"
        // - "תמחור לפרויקט לפני מע"מ"

        console.log(`➕ יוצר אופציה ${option.id}:`, newOptionFields);

        const newOptionResponse = await fetch(
          `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${OPTIONS_TABLE}`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${AIRTABLE_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              fields: newOptionFields,
            }),
          }
        );

        if (!newOptionResponse.ok) {
          const errorText = await newOptionResponse.text();
          console.error(`❌ Failed to create option ${option.id}:`, errorText);
        } else {
          const newOption = await newOptionResponse.json();
          optionIds.push(newOption.id);
          console.log(`✅ אופציה ${option.id} נוצרה`);
        }
      }
    }

    // 3. עדכן את רשימת האופציות בהצעת המחיר
    if (optionIds.length > 0) {
      await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${QUOTES_TABLE}/${quoteRecordId}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${AIRTABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fields: {
              'אופציות להצעת מחיר 4': optionIds,
            },
          }),
        }
      );
      console.log('✅ רשימת אופציות עודכנה');
    }

    console.log('✅ הצעת מחיר נשמרה בהצלחה');

    return NextResponse.json({
      success: true,
      message: 'הצעת מחיר נשמרה בהצלחה',
      quoteRecordId,
      optionIds,
    });

  } catch (error: any) {
    console.error('❌ שגיאה בשמירת הצעת מחיר:', error);
    return NextResponse.json(
      { 
        error: 'שגיאה בשמירת הצעת מחיר לאיירטייבל',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
