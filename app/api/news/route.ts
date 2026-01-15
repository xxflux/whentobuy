import { NextResponse } from 'next/server';
import { fetchHousingNews } from '@/common/lib/api-clients';

export async function GET() {
  try {
    const news = await fetchHousingNews('Trump housing policy Las Vegas');
    return NextResponse.json({ articles: news });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
