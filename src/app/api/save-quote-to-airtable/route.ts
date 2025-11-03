import { NextRequest, NextResponse } from 'next/server';

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

const QUOTES_TABLE = 'tbl9d2UhyRrNVjGxW';
const OPTIONS_TABLE = 'tblkRYwCcYfEG6iAO';
const OPPORTUNITIES_TABLE = 'tbl4fGlUM8KCbCS0R';

function isValidRecordId(id: string): boolean {
  return /^rec[a-zA-Z0-9]{14}$/.test(id);
}

export async function POST(request: NextRequest) {
  try {
    const quoteData = await request.json();
    
    console.log('💾 שומר הצעת מחיר:', quoteData.quoteNumber);

    const isValidQuoteRecordId = quoteData.id && isValidRecordId(quoteData.id);
    let quoteRecordId: string;

    // 1. וודא שיש הצעת מחיר
    if (isValidQuoteRecordId) {
      quoteRecordId = quoteData.id;
      console.log('✅ הצעת מחיר קיימת:', quoteRecordId);
    } else {
      const response = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${QUOTES_TABLE}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: { 'שם לקוח': quoteData.customerName || 'לקוח חדש' } }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ שגיאה ביצירת הצעת מחיר:', errorText);
        throw new Error(`Failed to create quote: ${errorText}`);
      }

      const newQuote = await response.json();
      quoteRecordId = newQuote.id;
      console.log('✅ הצעת מחיר נוצרה:', quoteRecordId);
    }

    // 2. עדכן אופציות
    const optionIds: string[] = [];
    for (const option of quoteData.options) {
      if (option.airtableId && isValidRecordId(option.airtableId)) {
        const fields: any = {
          'כותרת אופציה': option.title || `אופציה ${option.id}`,
          'Option Letter': option.id,
          'מוצרים': option.items?.filter((i: any) => i.type === 'product' && isValidRecordId(i.id)).map((i: any) => i.id) || [],
          'מוצרי אריזה ומיתוג copy': option.items?.filter((i: any) => i.type === 'packaging' && isValidRecordId(i.id)).map((i: any) => i.id) || [],
        };
        if (option.packageId && isValidRecordId(option.packageId)) fields['שם מארז'] = [option.packageId];
        if (option.shippingCost !== undefined) fields['תמחור משלוח ללקוח'] = option.shippingCost;
        if (option.deliveryCompany) fields['חברת משלוחים'] = option.deliveryCompany;
        if (option.deliveryBoxesCount) fields['כמות קרטונים להובלה'] = option.deliveryBoxesCount.toString();

        console.log(`🔄 מעדכן אופציה ${option.id}`);
        const response = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${OPTIONS_TABLE}/${option.airtableId}`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ fields }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ שגיאה בעדכון אופציה ${option.id}:`, errorText);
        } else {
          console.log(`✅ אופציה ${option.id} עודכנה`);
        }

        optionIds.push(option.airtableId);
      } else {
        const fields: any = {
          'קישור להצעת מחיר': [quoteRecordId],
          'Option Letter': option.id,
          'כותרת אופציה': option.title || `אופציה ${option.id}`,
          'שם לקוח': quoteData.customerName || '',
        };
        if (option.packageId && isValidRecordId(option.packageId)) fields['שם מארז'] = [option.packageId];
        const productIds = option.items?.filter((i: any) => i.type === 'product' && isValidRecordId(i.id)).map((i: any) => i.id) || [];
        const packagingIds = option.items?.filter((i: any) => i.type === 'packaging' && isValidRecordId(i.id)).map((i: any) => i.id) || [];
        if (productIds.length) fields['מוצרים'] = productIds;
        if (packagingIds.length) fields['מוצרי אריזה ומיתוג copy'] = packagingIds;

        const response = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${OPTIONS_TABLE}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ fields }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ שגיאה ביצירת אופציה ${option.id}:`, errorText);
        } else {
          const newOption = await response.json();
          optionIds.push(newOption.id);
          console.log(`✅ אופציה ${option.id} נוצרה`);
        }
      }
    }

    // 3. עדכן הזדמנות מכירה - רק שדות שניתן לעדכן!
    if (quoteData.opportunityId && isValidRecordId(quoteData.opportunityId)) {
      const fields: any = {};
      
      // פרטי לקוח בסיסיים
      if (quoteData.customerName !== undefined) fields['שם מלא'] = quoteData.customerName;
      if (quoteData.customerEmail !== undefined) fields['Email'] = quoteData.customerEmail;
      if (quoteData.customerPhone !== undefined) fields['טלפון'] = quoteData.customerPhone;
      if (quoteData.customerCompany !== undefined) fields['חברה מקושרת'] = quoteData.customerCompany;
      
      // תקציב (רק שדות שאינם מחושבים)
      if (quoteData.packageQuantity !== undefined) fields['כמות מארזים'] = quoteData.packageQuantity;
      if (quoteData.budgetPerPackage !== undefined) fields['תקציב'] = quoteData.budgetPerPackage;
      if (quoteData.includeVAT !== undefined) fields['מחירים כולל מע"מ'] = quoteData.includeVAT;
      if (quoteData.includeShipping !== undefined) fields['תקציב כולל משלוח'] = quoteData.includeShipping;
      
      // דגשים ומשלוח
      if (quoteData.customerNotes !== undefined) fields['דגשים מהלקוח'] = quoteData.customerNotes;
      if (quoteData.customerSticker !== undefined) fields['מדבקת לקוח'] = quoteData.customerSticker;
      if (quoteData.customerCard !== undefined) fields['גלוית לקוח'] = quoteData.customerCard;
      if (quoteData.preferredPackaging !== undefined) fields['סוג אריזה מועדף'] = quoteData.preferredPackaging;
      if (quoteData.deliveryAddress !== undefined) fields['כתובת אספקה'] = quoteData.deliveryAddress;
      if (quoteData.deliveryDate !== undefined) fields['תאריך אספקה מבוקש'] = quoteData.deliveryDate;

      console.log('🔄 מעדכן הזדמנות מכירה:', quoteData.opportunityId);
      console.log('📝 שדות שנשלחים:', JSON.stringify(fields, null, 2));

      const response = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${OPPORTUNITIES_TABLE}/${quoteData.opportunityId}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ שגיאה בעדכון הזדמנות:', errorText);
        throw new Error(`Failed to update opportunity: ${errorText}`);
      } else {
        const result = await response.json();
        console.log('✅ הזדמנות מכירה עודכנה בהצלחה!');
      }
    } else {
      console.log('⚠️ אין opportunityId - לא מעדכנים הזדמנות');
    }

    // 4. עדכן רשימת אופציות בהצעת מחיר
    if (optionIds.length) {
      await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${QUOTES_TABLE}/${quoteRecordId}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: { 'אופציות להצעת מחיר 4': optionIds } }),
      });
    }

    console.log('✅ הכל נשמר בהצלחה!');
    return NextResponse.json({ success: true, quoteRecordId, optionIds });
  } catch (error: any) {
    console.error('❌ שגיאה כללית:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
