import { NextResponse } from 'next/server';
import { analyzeHousingMarket } from '@/common/lib/gemini-service';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const analysis = await analyzeHousingMarket(data);
    return NextResponse.json({ analysis });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
