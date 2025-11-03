import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const Airtable = require('airtable');
    
    console.log('🔍 בודק חיבור לאיירטייבל עם משתנים מעודכנים...');
    
    // הצגת משתני הסביבה
    const apiKey = process.env.AIRTABLE_API_KEY;
    const baseId = process.env.AIRTABLE_BASE_ID;
    
    console.log('API Key קיים:', !!apiKey);
    console.log('Base ID:', baseId);
    console.log('API Key מתחיל ב-pat:', apiKey?.startsWith('pat'));
    
    if (!apiKey || !baseId) {
      return NextResponse.json({
        success: false,
        error: 'משתני סביבה חסרים',
        details: {
          hasApiKey: !!apiKey,
          hasBaseId: !!baseId,
          envKeys: Object.keys(process.env).filter(key => key.includes('AIRTABLE'))
        }
      });
    }
    
    // יצירת חיבור לאיירטייבל
    const base = new Airtable({
      apiKey: apiKey
    }).base(baseId);
    
    console.log('✅ מנסה לגשת לטבלת קטלוג מוצרים...');
    
    const records = await base('מוצרים')
      .select({ 
        maxRecords: 1,
        fields: ['מוצר'] 
      })
      .firstPage();
      
    return NextResponse.json({
      success: true,
      message: 'חיבור לאיירטייבל תקין! 🎉',
      recordsFound: records.length,
      details: {
        baseId: baseId,
        apiKeyPrefix: apiKey.substring(0, 15) + '...',
        firstProduct: records[0]?.get('מוצר') || 'אין מוצרים'
      }
    });
    
  } catch (error: any) {
    console.error('❌ שגיאה:', error);
    
    return NextResponse.json({
      success: false,
      error: 'שגיאה בחיבור לאיירטייבל',
      details: {
        message: error.message,
        type: error.error,
        statusCode: error.statusCode
      }
    }, { status: 500 });
  }
}