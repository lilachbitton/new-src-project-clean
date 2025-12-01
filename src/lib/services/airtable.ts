import Airtable from 'airtable';
import { Product, Package, Catalog } from '@/types';

// Initialize Airtable - עם המשתנים הנכונים כמו בפרויקט הישן
const base = new Airtable({
  apiKey: process.env.AIRTABLE_API_KEY
}).base(process.env.AIRTABLE_BASE_ID!);

// =====================
// Products Functions  
// =====================

/**
 * טעינת כל המוצרים מטבלת "קטלוג מוצרים"
 */
export async function fetchAllProducts(): Promise<Product[]> {
  try {
    console.log('🔄 טוען מוצרים מאיירטייבל...');
    
    const records = await base('מוצרים')
      .select()
      .all();
    
    const products = records.map((record: any) => {
      const fields = record.fields;
      return {
        id: record.id,
        name: fields['מוצר'] as string || 'מוצר ללא שם',
        details: (fields['פירוט'] || fields['גודל'] || '') as string,
        marketingDescription: fields['תיאור שיווקי'] as string || '',
        price: Number(fields['מחיר לפני מעמ']) || 0,
        productType: fields['סוג מוצר'] as string || '',
        inventory: fields['מלאי יתר/חסר'] as string || '',
        boxesPerCarton: Number(fields['כמות בקרטון']) || 1,
        type: determineProductType(fields['סוג מוצר'] as string)
      };
    });
    
    console.log(`✅ נטענו ${products.length} מוצרים מאיירטייבל`);
    return products;
  } catch (error) {
    console.error('❌ שגיאה בטעינת מוצרים:', error);
    throw error;
  }
}

/**
 * טעינת מוצרים לפי מזהים
 */
export async function fetchProductsByIds(productIds: string[]): Promise<Product[]> {
  try {
    if (!productIds.length) {
      console.log('🔍 fetchProductsByIds: רשימת מזהים ריקה');
      return [];
    }
    
    console.log('🔄 טוען מוצרים לפי מזהים:', productIds.slice(0, 3), productIds.length > 3 ? `(ועוד ${productIds.length - 3})` : '');
    const formula = `OR(${productIds.map(id => `RECORD_ID()='${id}'`).join(',')})`;
    
    const records = await base('מוצרים')
      .select({ filterByFormula: formula })
      .all();
    
    const products = records.map((record: any) => {
      const fields = record.fields;
      return {
        id: record.id,
        name: fields['מוצר'] as string || 'מוצר ללא שם',
        details: (fields['פירוט'] || fields['גודל'] || '') as string,
        marketingDescription: fields['תיאור שיווקי'] as string || '',
        price: Number(fields['מחיר לפני מעמ']) || 0,
        productType: fields['סוג מוצר'] as string || '',
        inventory: fields['מלאי יתר/חסר'] as string || '',
        boxesPerCarton: Number(fields['כמות בקרטון']) || 1,
        type: determineProductType(fields['סוג מוצר'] as string)
      };
    });
    
    console.log(`✅ fetchProductsByIds: נטענו ${products.length} מוצרים מתוך ${productIds.length} מבוקשים`);
    return products;
  } catch (error) {
    console.error('❌ שגיאה בטעינת מוצרים לפי מזהים:', error);
    throw error;
  }
}

// =====================
// Packages Functions
// =====================

/**
 * טעינת כל המארזים מטבלת "מארזים" שמסומנים כפעילים
 */
export async function fetchActivePackages(): Promise<Package[]> {
  try {
    console.log('🔄 טוען מארזים פעילים מאיירטייבל...');
    
    // טעינת כל המארזים עם סינון שדה "פעיל" - אם לא קיים אם יטען הכל
    let records;
    try {
      records = await base('מארזים')
        .select({
          filterByFormula: '{פעיל} = TRUE()'
        })
        .all();
      console.log(`🔍 נמצאו ${records.length} מארזים פעילים`);
    } catch (filterError) {
      console.log('⚠️ שדה "פעיל" לא קיים, טוען הכל...');
      records = await base('מארזים')
        .select({
          maxRecords: 20 // מגביל ל-20 לבדיקה
        })
        .all();
      console.log(`🔍 נמצאו ${records.length} מארזים בסך הכל`);
    }
    
    if (records.length > 0) {
      console.log('🔍 דוגמה לרשומה ראשונה:', {
        id: records[0].id,
        name: records[0].get('שם'),
        price: records[0].get('מחיר בש"ח'),
        items: records[0].get('מוצרים'),
        packaging: records[0].get('מוצרי מיתוג ואריזה')
      });
    }
    
    const packages = await Promise.all(
      records.map(async (record: any) => {
        const itemIds = (record.get('מוצרים') as string[]) || [];
        const packagingIds = (record.get('מוצרי מיתוג ואריזה') as string[]) || [];
        const parallelPackages = (record.get('מארז מקביל') as string[]) || [];
        
        console.log(`🔍 מעבד מארז: ${record.get('שם')}, מוצרים: ${itemIds.length}, אריזה: ${packagingIds.length}`);
        
        // טעינת המוצרים והאריזות של המארז
        const [items, packagingItems] = await Promise.all([
          fetchProductsByIds(itemIds),
          fetchProductsByIds(packagingIds)
        ]);
        
        const packageData = {
          id: record.id,
          name: record.get('שם') as string || 'מארז ללא שם',
          packageNumber: record.get('מספר מארז') as string || undefined, // הוסף מספר מארז
          packagePrice: Number(record.get('מחיר בש"ח')) || 0,
          items,
          packagingItems,
          imageUrl: record.get('Attachments')?.[0]?.url,
          parallelPackages
        };
        
        console.log(`✅ מארז נוצר: ${packageData.name}, מחיר: ${packageData.packagePrice}`);
        return packageData;
      })
    );
    
    console.log(`✅ נטענו ${packages.length} מארזים פעילים מאיירטייבל`);
    return packages;
  } catch (error) {
    console.error('❌ שגיאה בטעינת מארזים:', error);
    throw error;
  }
}

/**
 * טעינת מארזים לפי קטלוג (אם יש צורך בעתיד)
 */
export async function fetchPackagesByCatalog(catalogId: string): Promise<Package[]> {
  try {
    console.log('🔄 טוען מארזים לקטלוג:', catalogId);
    
    // קבלת הקטלוג
    const catalog = await base('קטלוגים').find(catalogId);
    const linkedPackages = catalog.get('מארזים') as string[];
    
    if (!linkedPackages?.length) {
      console.log('❌ לא נמצאו מארזים עבור קטלוג זה');
      return [];
    }
    
    // בניית פילטר למארזים פעילים בלבד
    const filterFormula = `AND(
      OR(${linkedPackages.map(id => `RECORD_ID()='${id}'`).join(',')}),
      {פעיל} = TRUE()
    )`;
    
    const records = await base('מארזים')
      .select({ filterByFormula: filterFormula })
      .all();
    
    const packages = await Promise.all(
      records.map(async (record: any) => {
        const itemIds = (record.get('מוצרים') as string[]) || [];
        const packagingIds = (record.get('מוצרי מיתוג ואריזה') as string[]) || [];
        const parallelPackages = (record.get('מארז מקביל') as string[]) || [];
        
        const [items, packagingItems] = await Promise.all([
          fetchProductsByIds(itemIds),
          fetchProductsByIds(packagingIds)
        ]);
        
        return {
          id: record.id,
          name: record.get('שם') as string || 'מארז ללא שם',
          packagePrice: Number(record.get('מחיר בש"ח')) || 0,
          items,
          packagingItems,
          imageUrl: record.get('Attachments')?.[0]?.url,
          parallelPackages
        };
      })
    );
    
    return packages;
  } catch (error) {
    console.error('❌ שגיאה בטעינת מארזים לפי קטלוג:', error);
    throw error;
  }
}

// =====================
// Catalogs Functions
// =====================

/**
 * טעינת כל הקטלוגים
 */
export async function fetchCatalogs(): Promise<Catalog[]> {
  try {
    console.log('🔄 טוען קטלוגים מאיירטייבל...');
    
    const records = await base('קטלוגים').select().all();
    
    const catalogs = records.map((record: any) => ({
      id: record.id,
      name: record.get('שם הקטלוג') as string || 'קטלוג ללא שם',
    }));
    
    console.log(`✅ נטענו ${catalogs.length} קטלוגים מאיירטייבל`);
    return catalogs;
  } catch (error) {
    console.error('❌ שגיאה בטעינת קטלוגים:', error);
    throw error;
  }
}

// =====================
// Helper Functions
// =====================

/**
 * קביעת סוג מוצר (product/packaging) לפי סוג המוצר
 */
function determineProductType(productType?: string): 'product' | 'packaging' {
  if (!productType) return 'product';
  
  const brandingTypes = ['אריזה', 'מיתוג', 'קיטלוג'];
  
  // השוואה ישירה ללא toLowerCase כי זה לא עובד עם עברית
  return brandingTypes.some(brandingType => 
    productType.includes(brandingType)
  ) ? 'packaging' : 'product';
}

// ייצוא הבסיס לשימוש נוסף במקומות אחרים
export { base };
