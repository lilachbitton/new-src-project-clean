import { NextRequest, NextResponse } from 'next/server';

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

const QUOTES_TABLE = 'tbl9d2UhyRrNVjGxW';
const OPTIONS_TABLE = 'tblkRYwCcYfEG6iAO';
const OPPORTUNITIES_TABLE = 'tbl4fGlUM8KCbCS0R';
const PACKAGES_TABLE = 'tblS3sVyCau1AcEgK'; // טבלת מארזים

function isValidRecordId(id: string): boolean {
  return /^rec[a-zA-Z0-9]{14}$/.test(id);
}

async function fetchPackageImage(packageId: string): Promise<string | null> {
  try {
    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${PACKAGES_TABLE}/${packageId}`,
      {
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        },
      }
    );
    
    if (!response.ok) {
      console.warn(`⚠️ לא הצלחתי למשוך מידע על מארז ${packageId}`);
      return null;
    }
    
    const packageData = await response.json();
    console.log(`🔍 שדות המארז:`, Object.keys(packageData.fields));
    console.log(`🔍 Attachments קיים:`, !!packageData.fields['Attachments']);
    
    // נסה כמה אפשרויות לשם השדה של התמונה
    const imageUrl = packageData.fields['Attachments']?.[0]?.url || 
                     packageData.fields['תמונת מארז']?.[0]?.url ||
                     packageData.fields['תמונה']?.[0]?.url;
    
    if (imageUrl) {
      console.log(`✅ נמצאה תמונה למארז ${packageId}`);
    }
    
    return imageUrl || null;
  } catch (error) {
    console.error('❌ שגיאה במשיכת תמונת מארז:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const quoteData = await request.json();
    
    console.log('💾 שומר הצעת מחיר:', quoteData.quoteNumber);

    const isValidQuoteRecordId = quoteData.id && isValidRecordId(quoteData.id);
    let quoteRecordId: string;

    // 1. עדכן או צור הצעת מחיר
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
          'הוצאות נוספות': option.additionalExpenses || 0,
          // הוסף יעד רווחיות ועמלת סוכן
          'יעד רווחיות': option.profitTarget || null, // שמירה ישירה כאחוזים (36)
          'עמלת סוכן %': option.agentCommission || null, // שמירה ישירה כאחוזים (10)
          'סוכן': option.agent || null,
        };
        
        // עדכון מארז, תמונה ומספר מארז
        if (option.packageId && isValidRecordId(option.packageId)) {
          console.log(`📦 מעדכן מארז ${option.packageId}`);
          fields['שם מארז'] = [option.packageId];
          
          // משוך תמונה ישירות מהמארז
          const imageUrl = await fetchPackageImage(option.packageId);
          console.log(`🖼️ URL שנמשך:`, imageUrl);
          if (imageUrl) {
            // שימוש בפורמט הנכון ל-Airtable attachment field
            fields['תמונת מארז'] = [{ url: imageUrl }];
            console.log(`✅ מעדכן תמונה באופציה - URL: ${imageUrl}`);
            console.log(`✅ שדה תמונת מארז שנשמר:`, JSON.stringify(fields['תמונת מארז']));
          } else {
            console.log(`⚠️ לא נמצאה תמונה למארז ${option.packageId}`);
          }
          
          // הוסף מספר מארז אם קיים
          if (option.packageNumber) {
            fields['מספר מארז'] = option.packageNumber;
            console.log(`✅ מעדכן מספר מארז: ${option.packageNumber}`);
          }
        }
        
        if (option.deliveryCompany) fields['חברת משלוחים CLAUDE'] = option.deliveryCompany;
        if (option.projectPriceBeforeVAT !== undefined) fields['תמחור לפרויקט לפני מע"מ CLAUDE'] = option.projectPriceBeforeVAT;
        if (option.shippingPriceToClient !== undefined) fields['תמחור משלוח ללקוח CLAUDE'] = option.shippingPriceToClient;

        console.log(`🔄 מעדכן אופציה ${option.id}`);
        console.log(`📝 שדות שנשלחים לאיירטייבל:`, JSON.stringify(fields, null, 2));
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
          'הוצאות נוספות': option.additionalExpenses || 0,
          // הוסף יעד רווחיות ועמלת סוכן
          'יעד רווחיות': option.profitTarget || null, // שמירה ישירה כאחוזים (36)
          'עמלת סוכן %': option.agentCommission || null, // שמירה ישירה כאחוזים (10)
          'סוכן': option.agent || null,
        };
        
        // עדכון מארז, תמונה ומספר מארז
        if (option.packageId && isValidRecordId(option.packageId)) {
          console.log(`📦 [יצירה] מעדכן מארז ${option.packageId}`);
          fields['שם מארז'] = [option.packageId];
          
          // משוך תמונה ישירות מהמארז
          const imageUrl = await fetchPackageImage(option.packageId);
          console.log(`🖼️ [יצירה] URL שנמשך:`, imageUrl);
          if (imageUrl) {
            fields['תמונת מארז'] = [{ url: imageUrl }];
            console.log(`✅ [יצירה] מעדכן תמונה באופציה - URL: ${imageUrl}`);
            console.log(`✅ [יצירה] שדה תמונת מארז:`, JSON.stringify(fields['תמונת מארז']));
          }
          
          // הוסף מספר מארז אם קיים
          if (option.packageNumber) {
            fields['מספר מארז'] = option.packageNumber;
            console.log(`✅ [יצירה] מעדכן מספר מארז: ${option.packageNumber}`);
          }
        }
        
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

    // 3. עדכן הזדמנות מכירה
    if (quoteData.opportunityId && isValidRecordId(quoteData.opportunityId)) {
      const fields: any = {};
      
      if (quoteData.customerName) fields['שם מלא'] = quoteData.customerName;
      if (quoteData.customerEmail) fields['Email'] = quoteData.customerEmail;
      if (quoteData.customerPhone) fields['טלפון'] = quoteData.customerPhone;
      if (quoteData.customerCompany) fields['חברה מקושרת'] = quoteData.customerCompany;
      if (quoteData.packageQuantity !== null && quoteData.packageQuantity !== undefined) fields['כמות מארזים'] = quoteData.packageQuantity;
      if (quoteData.budgetPerPackage !== null && quoteData.budgetPerPackage !== undefined) fields['תקציב'] = quoteData.budgetPerPackage;
      if (quoteData.includeVAT !== undefined) fields['מחירים כולל מע"מ'] = quoteData.includeVAT;
      if (quoteData.includeShipping !== undefined) fields['תקציב כולל משלוח'] = quoteData.includeShipping;
      if (quoteData.customerNotes) fields['דגשים מהלקוח'] = quoteData.customerNotes;
      if (quoteData.customerSticker) fields['מדבקת לקוח'] = quoteData.customerSticker;
      if (quoteData.customerCard) fields['גלוית לקוח'] = quoteData.customerCard;
      if (quoteData.preferredPackaging) fields['סוג אריזה מועדף'] = quoteData.preferredPackaging;
      if (quoteData.deliveryAddress) fields['כתובת אספקה'] = quoteData.deliveryAddress;
      if (quoteData.deliveryDate) fields['תאריך אספקה מבוקש'] = quoteData.deliveryDate;

      console.log('🔄 מעדכן הזדמנות מכירה:', quoteData.opportunityId);

      const response = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${OPPORTUNITIES_TABLE}/${quoteData.opportunityId}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ שגיאה בעדכון הזדמנות:', errorText);
      } else {
        console.log('✅ הזדמנות מכירה עודכנה');
      }
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
