import { NextResponse } from 'next/server';
import { supabase } from '@/common/lib/supabase-client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const region = searchParams.get('region') || null;
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    let query = supabase
      .from('gemini_analysis_history')
      .select('*')
      .order('execution_date', { ascending: false })
      .limit(limit);

    if (region) {
      query = query.eq('region', region);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching analysis history:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      data: data || [],
      count: data?.length || 0
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error: any) {
    console.error('Error in analysis history endpoint:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
