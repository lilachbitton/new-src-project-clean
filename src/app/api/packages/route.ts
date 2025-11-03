import { NextResponse } from 'next/server';
import { fetchActivePackages } from '@/lib/services/airtable';

export async function GET() {
  try {
    console.log('🔄 API: מקבל בקשה לטעינת מארזים פעילים');
    console.log('🔍 בודק משתני סביבה...');
    console.log('API Key קיים:', !!process.env.AIRTABLE_API_KEY);
    console.log('Base ID:', process.env.AIRTABLE_BASE_ID);
    
    const packages = await fetchActivePackages();
    
    console.log(`✅ API: מחזיר ${packages.length} מארזים פעילים`);
    return NextResponse.json({
      success: true,
      data: packages,
      count: packages.length
    });
  } catch (error) {
    console.error('❌ API: שגיאה בטעינת מארזים:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'שגיאה בטעינת מארזים מאיירטייבל',
        details: error instanceof Error ? error.message : 'שגיאה לא ידועה'
      },
      { status: 500 }
    );
  }
}