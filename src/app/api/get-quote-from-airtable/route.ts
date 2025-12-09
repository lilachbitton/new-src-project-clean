import { NextRequest, NextResponse } from 'next/server';

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

// Table IDs
const QUOTES_TABLE = 'tbl9d2UhyRrNVjGxW'; // הצעות מחיר ללקוח
const OPTIONS_TABLE = 'tblkRYwCcYfEG6iAO'; // אופציות להצעת מחיר
const OPPORTUNITIES_TABLE = 'tbl4fGlUM8KCbCS0R'; // הזדמנויות מכירה
const PRODUCTS_TABLE = 'tbluPDR4eOtWC8D9J'; // מוצרים
const OCCASIONS_TABLE = 'tblMdaIGhzy63b51t'; // מועדים וחגים

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const quoteId = searchParams.get('quoteId');

    console.log('🔍 Starting quote fetch:', { quoteId, hasApiKey: !!AIRTABLE_API_KEY, hasBaseId: !!AIRTABLE_BASE_ID });

    if (!quoteId) {
      return NextResponse.json(
        { error: 'חסר quoteId' },
        { status: 400 }
      );
    }

    if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
      console.error('❌ Missing Airtable credentials');
      return NextResponse.json(
        { error: 'חסרים נתוני התחברות לאיירטייבל' },
        { status: 500 }
      );
    }

    console.log('🔄 Fetching quote from Airtable...');

    // 1. משוך את הצעת המחיר
    const quoteResponse = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${QUOTES_TABLE}/${quoteId}`,
      {
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        },
      }
    );

    if (!quoteResponse.ok) {
      const errorText = await quoteResponse.text();
      console.error('❌ Airtable API error:', quoteResponse.status, errorText);
      throw new Error(`Failed to fetch quote: ${quoteResponse.status} ${errorText}`);
    }

    const quoteRecord = await quoteResponse.json();
    const fields = quoteRecord.fields;

    console.log('📄 Quote fetched successfully:', fields['מספר הצעה']);

    // 2. משוך הזדמנות מכירה (אם יש)
    let opportunityData = null;
    if (fields['הזדמנויות מכירה'] && fields['הזדמנויות מכירה'].length > 0) {
      try {
        const opportunityId = fields['הזדמנויות מכירה'][0];
        console.log('🎯 Fetching opportunity:', opportunityId);
        
        const opportunityResponse = await fetch(
          `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${OPPORTUNITIES_TABLE}/${opportunityId}`,
          {
            headers: {
              Authorization: `Bearer ${AIRTABLE_API_KEY}`,
            },
          }
        );

        if (opportunityResponse.ok) {
          const opportunityRecord = await opportunityResponse.json();
          opportunityData = opportunityRecord.fields;
          console.log('✅ Opportunity fetched');
        }
      } catch (error) {
        console.warn('⚠️ Error fetching opportunity:', error);
      }
    }

    // 3. משוך אופציות
    let optionsData: any[] = [];
    if (fields['אופציות להצעת מחיר 4'] && fields['אופציות להצעת מחיר 4'].length > 0) {
      const optionIds = fields['אופציות להצעת מחיר 4'];
      console.log(`📋 Fetching ${optionIds.length} options...`);
      
      try {
        const optionsPromises = optionIds.map(async (optionId: string) => {
          try {
            const response = await fetch(
              `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${OPTIONS_TABLE}/${optionId}`,
              {
                headers: {
                  Authorization: `Bearer ${AIRTABLE_API_KEY}`,
                },
              }
            );
            if (response.ok) {
              return await response.json();
            }
            return null;
          } catch (error) {
            console.warn(`⚠️ Error fetching option ${optionId}:`, error);
            return null;
          }
        });

        const optionsRecords = await Promise.all(optionsPromises);
        optionsData = optionsRecords
          .filter(record => record !== null)
          .map(record => ({
            id: record.id,
            ...record.fields
          }));
        
        console.log(`✅ Fetched ${optionsData.length} options successfully`);
      } catch (error) {
        console.error('❌ Error fetching options:', error);
      }
    }

    // 4. בנה מבנה סופי
    const quoteData = sanitizeAirtableData({
      // מזהים
      id: quoteRecord.id,
      quoteNumber: fields['מספר הצעה'] || '',
      
      // פרטי לקוח
      customerName: fields['שם לקוח'] || opportunityData?.['שם מלא'] || '',
      customerEmail: opportunityData?.['Email'] || '',
      customerPhone: fields['מספר טלפון איש קשר'] || opportunityData?.['טלפון'] || '',
      customerCompany: opportunityData?.['שם חברה'] || '',
      
      // תאריכים
      deliveryDate: fields['תאריך אספקה'] || opportunityData?.['תאריך אספקה מבוקש'] || '',
      deliveryTime: opportunityData?.['שעת אספקה'] || '',
      
      // תקציב וכמויות
      packageQuantity: fields['כמות מארזים'] || opportunityData?.['כמות מארזים'] || undefined,
      budgetPerPackage: fields['תקציב למארז'] || opportunityData?.['תקציב'] || undefined,
      budgetBeforeVAT: opportunityData?.['תקציב למארז לפני מע"מ'] || undefined,
      budgetWithVAT: opportunityData?.['תקציב למארז כולל מעמ'] || undefined,
      includeVAT: opportunityData?.['מחירים כולל מע"מ'] || false,
      includeShipping: opportunityData?.['תקציב כולל משלוח'] || false,
      
      // רווחיות
      profitTarget: 36, // 36% כברירת מחדל
      agent: opportunityData?.['סוכן'] || '', // סוכן מהזדמנות מכירה
      agentCommission: (opportunityData?.['עמלת סוכן %'] || 0) * 100, // המרה מעשרוני לאחוזים (0.10 → 10)
      
      // פרטים נוספים
      deliveryAddress: opportunityData?.['כתובת אספקה'] || '',
      deliveryType: opportunityData?.['הפצה'] || '',
      distribution: opportunityData?.['הפצה'] || '', // הפצה - לתצוגה בלבד
      customerNotes: fields['איש קשר'] || opportunityData?.['דגשים מהלקוח'] || '',
      customerPreferences: opportunityData?.['דגשים והעדפות'] || '',
      celebration: opportunityData?.['מה חוגגים'] || '',
      giftRecipients: opportunityData?.['מי מקבל את המתנות'] || '',
      
      // גלויות ומדבקות
      customerCard: fields['גלוית לקוח'] || opportunityData?.['גלוית לקוח'] || '',
      customerSticker: fields['מדבקת לקוח'] || opportunityData?.['מדבקת לקוח'] || '',
      preferredPackaging: opportunityData?.['סוג אריזה מועדף'] || '',
      
      // סטטוס
      status: fields['סטאטוס'] || '',
      
      // הזדמנות מכירה
      opportunityId: fields['הזדמנויות מכירה']?.[0] || undefined,
      occasion: opportunityData?.['מועד'] ? await fetchOccasionNames(opportunityData['מועד']) : [],
      
      // אופציות
      options: await buildOptions(optionsData),
    });

    console.log('✅ Quote data built successfully');

    return NextResponse.json(quoteData);

  } catch (error: any) {
    console.error('❌ Error in get-quote-from-airtable:', error);
    return NextResponse.json(
      { 
        error: 'שגיאה במשיכת הצעת מחיר מהאיירטייבל',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// פונקציה כללית לניקוי אובייקט שלם מאיירטייבל
function sanitizeAirtableData(data: any): any {
  if (data === null || data === undefined) {
    return null;
  }
  
  // אם זה אובייקט עם specialValue - החזר null
  if (typeof data === 'object' && !Array.isArray(data) && 'specialValue' in data) {
    return null;
  }
  
  // אם זה אובייקט רגיל (לא array)
  if (typeof data === 'object' && !Array.isArray(data)) {
    const cleaned: any = {};
    for (const key in data) {
      cleaned[key] = sanitizeAirtableData(data[key]);
    }
    return cleaned;
  }
  
  // אם זה array
  if (Array.isArray(data)) {
    return data.map(item => sanitizeAirtableData(item));
  }
  
  // ערכים פרימיטיביים
  return data;
}

// פונקציות עזר לניקוי ערכים מאיירטייבל
function safeString(value: any): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value[0] || '';
  if (typeof value === 'object') return '';
  return String(value);
}

function safeValue(value: any, defaultVal: any = undefined): any {
  if (value === null || value === undefined) return defaultVal;
  if (typeof value === 'object' && !Array.isArray(value)) return defaultVal;
  if (Array.isArray(value)) return value[0] || defaultVal;
  return value;
}

// פונקציה לבניית אופציות
async function buildOptions(optionsData: any[]) {
  const options = [];

  for (const option of optionsData) {
    try {
      let items: any[] = [];
      
      // מוצרים רגילים
      if (option['מוצרים'] && option['מוצרים'].length > 0) {
        const products = await fetchProducts(option['מוצרים'], 'product');
        items = [...items, ...products];
      }

      // מוצרי אריזה
      if (option['מוצרי אריזה ומיתוג copy'] && option['מוצרי אריזה ומיתוג copy'].length > 0) {
        const packagingItems = await fetchProducts(option['מוצרי אריזה ומיתוג copy'], 'packaging');
        items = [...items, ...packagingItems];
      }

      const optionData = {
        id: safeString(option['Option Letter'] || option['מספר אופציה'] || 'A'),
        airtableId: option.id,
        packageId: safeValue(option['שם מארז']?.[0]),
        title: safeString(option['כותרת אופציה'] || `אופציה ${option['Option Letter'] || 'A'}`),
        items,
        
        // חישובים - כל השדות מאיירטייבל
        total: (option['תמחור לפרויקט לפני מע"מ'] || 0) * 1.18,
        profitTarget: (option['יעד רווחיות'] || 0) * 100, // המרה מעשרוני לאחוזים (0.36 → 36)
        agent: safeValue(option['סוכן']),
        agentCommission: (option['עמלת סוכן %'] || 0) * 100, // המרה מעשרוני לאחוזים (0.10 → 10)
        costPrice: option['מחיר עלות'] || 0,
        additionalExpenses: option['הוצאות נוספות'] || 0,
        packagingWorkCost: option['עלות עבודת אריזה'] || 0,
        packagingItemsCost: option['עלות מוצרי אריזה ומיתוג'] || 0,
        productsCost: option['עלות מוצרים בפועל'] || 0,
        budgetRemainingForProducts: option['תקציב נותר למוצרים'] || 0,
        productQuantity: option['כמות מוצרים'] || 0,
        actualProfitPercentage: option['% רווח בפועל למארז'] || 0,
        profitPerDeal: option['רווח לעסקה בשקלים'] || 0,
        totalDealProfit: option['סה"כ רווח לעסקה'] || 0,
        revenueWithoutVAT: option['הכנסה ללא מע"מ'] || 0,
        actualProfit: option['רווח בפועל למארז'] || 0,
        
        // משלוח - 9 שדות
        deliveryCompany: safeString(option['חברת משלוחים CLAUDE']),
        packaging: safeString(option['אריזה CLAUDE']),
        unitsPerCarton: option['כמות שנכנסת בקרטון CLAUDE'] || undefined,
        deliveryBoxesCount: option['כמות קרטונים להובלה CLAUDE'] || undefined,
        finalDeliveryBoxes: option['כמות קרטונים סופית להובלה'] || undefined,
        deliveryBreakdown: safeString(option['פירוט החלוקה']),
        projectPriceBeforeVAT: option['תמחור לפרויקט לפני מע"מ CLAUDE'] || 0,
        projectPriceWithVAT: option['תמחור לפרויקט כולל מע"מ CLAUDE'] || 0,
        projectPriceToClientBeforeVAT: option['תמחור לפרויקט ללקוח לפני מע"מ CLAUDE'] || 0,
        projectPriceToClientWithVAT: option['תמחור לפרויקט ללקוח כולל מע"מ CLAUDE'] || 0,
        shippingPriceToClient: option['תמחור משלוח ללקוח CLAUDE'] || 0,
        
        // מארז ותמונה
        packageNumber: option['מספר מארז'] || undefined,
        image: option['תמונת מארז']?.[0]?.url || undefined,
        
        // סטטוס
        status: safeString(option['סטאטוס']), // טוען את הסטטוס המלא
        internalStatus: safeString(option['סטטוס פנימי']),
        
        // UI
        isCollapsed: false,
      };

      options.push(optionData);
    } catch (error) {
      console.warn(`⚠️ Error building option:`, error);
    }
  }

  // אם אין אופציות, צור אופציה ריקה
  if (options.length === 0) {
    options.push({
      id: 'A',
      title: 'אופציה 1',
      items: [],
      total: 0,
      status: 'אופציה בעבודה',
      isCollapsed: false,
    });
  }

  return options;
}

// פונקציה למשיכת מוצרים
async function fetchProducts(productIds: string[], type: 'product' | 'packaging') {
  if (!productIds || productIds.length === 0) return [];
  
  try {
    const productsPromises = productIds.map(async (productId: string) => {
      try {
        const response = await fetch(
          `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${PRODUCTS_TABLE}/${productId}`,
          {
            headers: {
              Authorization: `Bearer ${AIRTABLE_API_KEY}`,
            },
          }
        );
        
        if (response.ok) {
          const record = await response.json();
          return {
            id: record.id,
            name: record.fields['מוצר'] || record.fields['שם מוצר'] || '',
            details: record.fields['תיאור שיווקי'] || '',
            price: record.fields['מחיר לפני מעמ'] || 0,
            type,
            productType: record.fields['סוג מוצר'] || '',
            inventory: record.fields['current inventory'] || '',
            boxesPerCarton: record.fields['כמות בקרטון'] || undefined,
          };
        }
        return null;
      } catch (error) {
        return null;
      }
    });

    const products = await Promise.all(productsPromises);
    return products.filter(p => p !== null);
  } catch (error) {
    console.error('❌ Error fetching products:', error);
    return [];
  }
}

// פונקציה למשיכת שמות מועדים
async function fetchOccasionNames(occasionIds: string[]): Promise<string[]> {
  if (!occasionIds || occasionIds.length === 0) return [];
  
  try {
    const occasionsPromises = occasionIds.map(async (occasionId: string) => {
      try {
        const response = await fetch(
          `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${OCCASIONS_TABLE}/${occasionId}`,
          {
            headers: {
              Authorization: `Bearer ${AIRTABLE_API_KEY}`,
            },
          }
        );
        
        if (response.ok) {
          const record = await response.json();
          return record.fields['שם מועד'] || record.fields['שם'] || record.fields['Name'] || '';
        }
        return null;
      } catch (error) {
        return null;
      }
    });

    const occasions = await Promise.all(occasionsPromises);
    return occasions.filter(o => o !== null) as string[];
  } catch (error) {
    console.error('❌ Error fetching occasions:', error);
    return [];
  }
}
