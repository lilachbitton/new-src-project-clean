import { NextRequest, NextResponse } from 'next/server';

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const BASE_ID = 'appvBS9QS8KiOdpmk';
const QUOTES_TABLE_ID = 'tbl9d2UhyRrNVjGxW';

export async function POST(request: NextRequest) {
  try {
    const { quoteId, status } = await request.json();

    if (!quoteId || !status) {
      return NextResponse.json(
        { error: 'Missing quoteId or status' },
        { status: 400 }
      );
    }

    if (!AIRTABLE_API_KEY) {
      console.error('❌ AIRTABLE_API_KEY is not set');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    console.log(`📝 מעדכן סטטוס להצעה ${quoteId} ל-"${status}"`);

    // עדכן את הסטטוס באיירטייבל
    const response = await fetch(
      `https://api.airtable.com/v0/${BASE_ID}/${QUOTES_TABLE_ID}/${quoteId}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fields: {
            'סטאטוס': status
          }
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Airtable API Error:', errorData);
      throw new Error(`Airtable API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ סטטוס עודכן בהצלחה:', data);

    return NextResponse.json({ success: true, data });

  } catch (error: any) {
    console.error('❌ שגיאה בעדכון סטטוס:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update status',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
