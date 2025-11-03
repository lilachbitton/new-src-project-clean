import { NextResponse } from 'next/server';

// ייבוא ישיר של Airtable כמו בפרויקט הישן
const Airtable = require('airtable');

export async function GET() {
  try {
    console.log('🔄 API: מקבל בקשה לטעינת מוצרים');
    
    // הגדרת חיבור אייטייבל בדיוק כמו בפרויקט הישן
    const base = new Airtable({
      apiKey: process.env.AIRTABLE_API_KEY
    }).base(process.env.AIRTABLE_BASE_ID!);
    
    console.log('🔄 טוען מוצרים מאיירטייבל...');
    
    // קוד מעותק בדיוק מהפרויקט הישן
    const records = await base('מוצרים')
      .select()
      .all();
    
    const products = records.map((record: any) => {
      const fields = record.fields;
      return {
        id: record.id,
        name: fields['מוצר'] || 'מוצר ללא שם',
        details: fields['פירוט'] || fields['גודל'] || '',
        marketingDescription: fields['תיאור שיווקי'] || '', 
        price: Number(fields['מחיר לפני מעמ']) || 0,
        productType: fields['סוג מוצר'] as string,
        inventory: fields['מלאי יתר/חסר'] as string,
        boxesPerCarton: Number(fields['כמות בקרטון']) || 1,
        type: determineProductType(fields['סוג מוצר'] as string)
      };
    });
    
    console.log(`✅ נטענו ${products.length} מוצרים מאיירטייבל`);
    
    return NextResponse.json({
      success: true,
      data: products,
      count: products.length
    });
  } catch (error) {
    console.error('❌ שגיאה בטעינת מוצרים:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'שגיאה בטעינת מוצרים מאיירטייבל',
        details: error instanceof Error ? error.message : 'שגיאה לא ידועה'
      },
      { status: 500 }
    );
  }
}

// פונקציה מועתקת מהפרויקט הישן
function determineProductType(productType?: string): 'product' | 'packaging' {
  if (!productType) return 'product';
  
  const brandingTypes = ['אריזה', 'מיתוג', 'קיטלוג'];
  const type = productType.toLowerCase();
  
  return brandingTypes.some(brandingType => 
    type.includes(brandingType.toLowerCase())
  ) ? 'packaging' : 'product';
}