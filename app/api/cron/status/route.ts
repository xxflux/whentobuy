import { NextResponse } from 'next/server';
import { supabase } from '@/common/lib/supabase-client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // Check for recent data in market_metrics (Las Vegas)
    const { data: marketData, error: marketError } = await supabase
      .from('market_metrics')
      .select('metric_name, metric_date, value')
      .eq('location', 'Las Vegas')
      .in('metric_date', [today, yesterdayStr])
      .order('metric_date', { ascending: false })
      .limit(10);

    // Check for recent economic indicators
    const { data: economicData, error: economicError } = await supabase
      .from('economic_indicators')
      .select('series_id, indicator_date, value')
      .in('indicator_date', [today, yesterdayStr])
      .order('indicator_date', { ascending: false })
      .limit(10);

    // Check for recent news
    const { data: newsData, error: newsError } = await supabase
      .from('housing_news')
      .select('title, published_at')
      .gte('published_at', yesterday.toISOString())
      .order('published_at', { ascending: false })
      .limit(5);

    const hasRecentMarketData = marketData && marketData.length > 0;
    const hasRecentEconomicData = economicData && economicData.length > 0;
    const hasRecentNews = newsData && newsData.length > 0;

    // Get the latest sync date
    const latestMarketDate = marketData?.[0]?.metric_date || null;
    const latestEconomicDate = economicData?.[0]?.indicator_date || null;

    return NextResponse.json({
      status: hasRecentMarketData || hasRecentEconomicData ? 'success' : 'unknown',
      lastSync: {
        marketMetrics: latestMarketDate,
        economicIndicators: latestEconomicDate,
        news: newsData?.[0]?.published_at || null
      },
      dataAvailable: {
        marketMetrics: hasRecentMarketData,
        economicIndicators: hasRecentEconomicData,
        news: hasRecentNews
      },
      counts: {
        marketMetrics: marketData?.length || 0,
        economicIndicators: economicData?.length || 0,
        news: newsData?.length || 0
      },
      today,
      yesterday: yesterdayStr,
      errors: {
        market: marketError?.message,
        economic: economicError?.message,
        news: newsError?.message
      }
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      error: error.message
    }, { status: 500 });
  }
}
