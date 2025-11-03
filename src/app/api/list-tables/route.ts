import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch(`https://api.airtable.com/v0/meta/bases/${process.env.AIRTABLE_BASE_ID}/tables`, {
      headers: {
        'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      tables: data.tables.map((table: any) => ({
        id: table.id,
        name: table.name,
        fieldsCount: table.fields?.length || 0
      }))
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'שגיאה בקבלת רשימת טבלאות',
      details: error.message
    }, { status: 500 });
  }
}