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
      const data = await fetchFredData(s, 100); // Fetch up to 100 historical points (since Jan 2025)
      if (data && data.length > 0) {
        // Upsert all observations to populate historical charts
        const upsertData = data.map((obs: any) => ({
          series_id: s,
          value: parseFloat(obs.value),
          indicator_date: obs.date
        })).filter((obs: any) => !isNaN(obs.value));

        if (upsertData.length > 0) {
          const { error } = await supabase.from('economic_indicators').upsert(upsertData, { 
            onConflict: 'series_id,indicator_date' 
          });
          if (error) console.error(`Error upserting ${s}:`, error);
        }
      }
    }

    // 2. Sync News (NewsAPI) - Use more specific, targeted queries
    const queries = [
      '"housing policy" OR "real estate policy"',
      '"mortgage rates" AND (housing OR "real estate")',
      '"Las Vegas" AND ("housing market" OR "real estate")',
      '"federal housing" OR "housing legislation"',
      '"home prices" AND (policy OR regulation)'
    ];

    // Keywords that indicate relevant articles
    const relevantKeywords = [
      'housing', 'real estate', 'mortgage', 'home price', 'property',
      'housing market', 'housing policy', 'real estate policy',
      'federal housing', 'housing legislation', 'housing regulation',
      'Las Vegas', 'Nevada', 'homebuyer', 'homeowner'
    ];

    // Function to check if article is relevant
    const isRelevant = (article: any): boolean => {
      const text = `${article.title} ${article.description || ''}`.toLowerCase();
      return relevantKeywords.some(keyword => text.includes(keyword.toLowerCase()));
    };

    const allArticles: any[] = [];

    for (const query of queries) {
      try {
        const news = await fetchHousingNews(query, { daysBack: 30 });
        if (news && news.length > 0) {
          // Filter for relevance
          const relevantArticles = news.filter(isRelevant);
          allArticles.push(...relevantArticles);
          console.log(`Query "${query}": ${news.length} total, ${relevantArticles.length} relevant`);
        }
      } catch (error) {
        console.error(`Error fetching news for "${query}":`, error);
      }
    }

    // Remove duplicates and store
    const uniqueArticles = Array.from(
      new Map(allArticles.map(article => [article.url, article])).values()
    ).sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    for (const article of uniqueArticles.slice(0, 50)) {
      await supabase.from('housing_news').upsert({
        title: article.title,
        description: article.description,
        url: article.url,
        published_at: article.publishedAt,
        source: article.source.name
      }, { onConflict: 'url' });
    }

    console.log(`Synced ${uniqueArticles.slice(0, 50).length} relevant news articles`);

    // 3. Sync Real Market Metrics for Las Vegas
    const [attomData, redfinData] = await Promise.all([
      fetchAttomMarketData('Las Vegas, NV'),
      fetchRedfinMarketStats('Las Vegas')
    ]);

    const medianPrice = attomData?.medianValue || redfinData?.median_sale_price;
    
    if (!medianPrice) {
      console.error('[Cron Sync] Error: Failed to fetch median sale price from AttomData and Redfin APIs. Skipping upsert.');
    } else {
      await supabase.from('market_metrics').upsert({
        location: 'Las Vegas',
        metric_name: 'median_sale_price',
        value: medianPrice,
        metric_date: new Date().toISOString().split('T')[0]
      }, { onConflict: 'location,metric_name,metric_date' });
    }

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
