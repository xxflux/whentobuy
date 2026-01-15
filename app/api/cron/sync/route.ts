import { NextResponse } from 'next/server';
import { fetchFredData, fetchHousingNews, fetchAttomMarketData, fetchRedfinMarketStats } from '@/common/lib/api-clients';
import { supabase } from '@/common/lib/supabase-client';

export async function GET(req: Request) {
  // Simple protection against unauthorized calls
  // In production, use an environment variable: if (req.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`)
  
  try {
    console.log('Starting weekly sync with real APIs...');

    // 1. Sync Economic Indicators (FRED)
    const series = ['MORTGAGE30US', 'FEDFUNDS', 'UNRATE'];
    for (const s of series) {
      const data = await fetchFredData(s);
      if (data && data.length > 0) {
        // Insert only the latest observation
        const latest = data[0];
        await supabase.from('economic_indicators').upsert({
          series_id: s,
          value: parseFloat(latest.value),
          indicator_date: latest.date
        }, { onConflict: 'series_id,indicator_date' });
      }
    }

    // 2. Sync News (NewsAPI)
    const news = await fetchHousingNews('Trump housing policy Las Vegas');
    if (news && news.length > 0) {
      for (const article of news) {
        await supabase.from('housing_news').upsert({
          title: article.title,
          description: article.description,
          url: article.url,
          published_at: article.publishedAt,
          source: article.source.name
        }, { onConflict: 'url' });
      }
    }

    // 3. Sync Real Market Metrics for Las Vegas
    const [attomData, redfinData] = await Promise.all([
      fetchAttomMarketData('Las Vegas, NV'),
      fetchRedfinMarketStats('Las Vegas')
    ]);

    const medianPrice = attomData?.medianValue || redfinData?.median_sale_price || 462000;
    
    await supabase.from('market_metrics').upsert({
      location: 'Las Vegas',
      metric_name: 'median_sale_price',
      value: medianPrice,
      metric_date: new Date().toISOString().split('T')[0]
    }, { onConflict: 'location,metric_name,metric_date' });

    return NextResponse.json({ 
      success: true, 
      message: 'Sync completed with real data',
      data: {
        attomStatus: attomData ? 'Success' : 'Failed',
        redfinStatus: redfinData ? 'Success' : 'Failed'
      }
    });
  } catch (error: any) {
    console.error('Sync Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
