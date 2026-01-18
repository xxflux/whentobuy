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
    const activeInventory = redfinData?.active_listings || attomData?.inventoryCount;
    const avgDOM = redfinData?.median_days_on_market || attomData?.avgDaysOnMarket;
    const today = new Date().toISOString().split('T')[0];
    
    if (!medianPrice) {
      console.error('[Cron Sync] Error: Failed to fetch median sale price from AttomData and Redfin APIs. Skipping upsert.');
    } else {
      await supabase.from('market_metrics').upsert({
        location: 'Las Vegas',
        metric_name: 'median_sale_price',
        value: medianPrice,
        metric_date: today
      }, { onConflict: 'location,metric_name,metric_date' });
    }

    // Also sync inventory and DOM for Las Vegas
    if (activeInventory) {
      await supabase.from('market_metrics').upsert({
        location: 'Las Vegas',
        metric_name: 'inventory',
        value: activeInventory,
        metric_date: today
      }, { onConflict: 'location,metric_name,metric_date' });
    }

    if (avgDOM) {
      await supabase.from('market_metrics').upsert({
        location: 'Las Vegas',
        metric_name: 'days_on_market',
        value: avgDOM,
        metric_date: today
      }, { onConflict: 'location,metric_name,metric_date' });
    }

    // 4. Sync Redfin Data Center CSV files (if URLs are configured)
    // Note: Redfin Data Center CSV URLs need to be manually configured
    // Weekly data is updated every Wednesday, monthly data on third Friday of month
    const redfinDataUrls = process.env.REDFIN_DATA_URLS ? JSON.parse(process.env.REDFIN_DATA_URLS) : [];
    let redfinSyncStatus = 'Skipped (no URLs configured)';
    
    if (redfinDataUrls && redfinDataUrls.length > 0) {
      try {
        const { downloadAndParseRedfinCSV } = await import('@/common/lib/api-clients');
        
        for (const url of redfinDataUrls) {
          try {
            console.log(`[Cron Sync] Fetching Redfin data from: ${url}`);
            const parsedData = await downloadAndParseRedfinCSV(url);
            
            if (parsedData && parsedData.rows && parsedData.rows.length > 0) {
              // Map and upsert Redfin data (similar to POST endpoint logic)
              const metricMappings: Record<string, string> = {
                'Median Sale Price': 'median_sale_price',
                'Homes Sold': 'homes_sold',
                'New Listings': 'new_listings',
                'Inventory': 'inventory',
                'Days on Market': 'days_on_market',
                'Average Sale Price': 'average_sale_price',
                'Price per Square Foot': 'price_per_sqft',
                'Months of Supply': 'months_of_supply',
                'Pending Sales': 'pending_sales',
                'Sold Above List Price': 'sold_above_list_price',
                'Sale-to-List Price Ratio': 'sale_to_list_ratio'
              };

              const dateColumn = parsedData.columns.find(col => 
                col.toLowerCase().includes('period') || 
                col.toLowerCase().includes('date') ||
                col.toLowerCase().includes('week') ||
                col.toLowerCase().includes('month')
              ) || parsedData.columns[0];

              const targetRegion = 'Las Vegas';
              const upsertData: any[] = [];
              const processedDates = new Set<string>();

              for (const row of parsedData.rows) {
                const dateValue = row[dateColumn];
                if (!dateValue) continue;

                let dataDate: string;
                if (typeof dateValue === 'string') {
                  const date = new Date(dateValue);
                  if (isNaN(date.getTime())) continue;
                  dataDate = date.toISOString().split('T')[0];
                } else {
                  continue;
                }

                const dateKey = `${dataDate}-${targetRegion}`;
                if (processedDates.has(dateKey)) continue;
                processedDates.add(dateKey);

                parsedData.columns.forEach(column => {
                  const metricName = metricMappings[column];
                  if (!metricName || column === dateColumn) return;

                  const value = row[column];
                  if (value === null || value === undefined || value === '') return;

                  const numValue = typeof value === 'number' ? value : parseFloat(String(value));
                  if (isNaN(numValue)) return;

                  upsertData.push({
                    region: targetRegion,
                    region_type: parsedData.regionType,
                    metric_name: metricName,
                    value: numValue,
                    data_date: dataDate,
                    data_type: parsedData.dataType,
                    source: 'redfin_data_center'
                  });
                });
              }

              if (upsertData.length > 0) {
                const { error: redfinError } = await supabase
                  .from('redfin_data')
                  .upsert(upsertData, { 
                    onConflict: 'region,metric_name,data_date' 
                  });

                if (redfinError) {
                  console.error('[Cron Sync] Redfin data upsert error:', redfinError);
                  redfinSyncStatus = `Error: ${redfinError.message}`;
                } else {
                  console.log(`[Cron Sync] Synced ${upsertData.length} Redfin data records`);
                  redfinSyncStatus = `Success: ${upsertData.length} records`;
                }
              }
            }
          } catch (urlError: any) {
            console.error(`[Cron Sync] Error processing Redfin URL ${url}:`, urlError);
          }
        }
      } catch (error: any) {
        console.error('[Cron Sync] Redfin data sync error:', error);
        redfinSyncStatus = `Error: ${error.message}`;
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Sync completed with real data',
      data: {
        attomStatus: attomData ? 'Success' : 'Failed',
        redfinStatus: redfinData ? 'Success' : 'Failed',
        redfinDataCenterStatus: redfinSyncStatus
      }
    });
  } catch (error: any) {
    console.error('Sync Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
