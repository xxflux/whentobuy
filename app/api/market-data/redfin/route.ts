import { NextResponse } from 'next/server';
import { downloadAndParseRedfinCSV, fetchRedfinDataCenterData } from '@/common/lib/api-clients';
import { supabase } from '@/common/lib/supabase-client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET endpoint to fetch Redfin data from database
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const region = searchParams.get('region') || 'Las Vegas';
  const metric = searchParams.get('metric'); // Optional: filter by specific metric

  try {
    // Fetch Redfin data from database
    let query = supabase
      .from('redfin_data')
      .select('*')
      .eq('region', region)
      .order('data_date', { ascending: false })
      .limit(1000);

    if (metric) {
      query = query.eq('metric_name', metric);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching Redfin data:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Group by metric for easier consumption
    const grouped: Record<string, any[]> = {};
    data?.forEach(row => {
      if (!grouped[row.metric_name]) {
        grouped[row.metric_name] = [];
      }
      grouped[row.metric_name].push({
        date: row.data_date,
        value: row.value,
        region: row.region
      });
    });

    // Sort each metric by date
    Object.keys(grouped).forEach(key => {
      grouped[key].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    });

    return NextResponse.json({
      region,
      metrics: grouped,
      latest: data?.[0] ? {
        metric: data[0].metric_name,
        value: data[0].value,
        date: data[0].data_date
      } : null,
      count: data?.length || 0
    });
  } catch (error: any) {
    console.error('Error in GET /api/market-data/redfin:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST endpoint to download and parse Redfin CSV file
 * Accepts a CSV URL or uses default Redfin Data Center URLs
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { csvUrl, region, regionType = 'metro' } = body;

    if (!csvUrl) {
      return NextResponse.json({ 
        error: 'csvUrl is required. Provide a CSV download URL from Redfin Data Center.' 
      }, { status: 400 });
    }

    console.log(`[Redfin Data] Downloading CSV from: ${csvUrl}`);

    // Download and parse CSV
    const parsedData = await downloadAndParseRedfinCSV(csvUrl);

    if (!parsedData || !parsedData.rows || parsedData.rows.length === 0) {
      return NextResponse.json({ 
        error: 'Failed to parse CSV or CSV is empty' 
      }, { status: 400 });
    }

    console.log(`[Redfin Data] Parsed ${parsedData.rows.length} rows with columns: ${parsedData.columns.join(', ')}`);

    // Map CSV columns to our database schema
    // Redfin CSV typically has columns like: Period End, Median Sale Price, Homes Sold, etc.
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

    // Find date column
    const dateColumn = parsedData.columns.find(col => 
      col.toLowerCase().includes('period') || 
      col.toLowerCase().includes('date') ||
      col.toLowerCase().includes('week') ||
      col.toLowerCase().includes('month')
    ) || parsedData.columns[0];

    const targetRegion = region || parsedData.region || 'Las Vegas';

    // Extract and store metrics
    const upsertData: any[] = [];
    const processedDates = new Set<string>();

    for (const row of parsedData.rows) {
      const dateValue = row[dateColumn];
      if (!dateValue) continue;

      // Parse date (handle various formats)
      let dataDate: string;
      if (typeof dateValue === 'string') {
        const date = new Date(dateValue);
        if (isNaN(date.getTime())) continue;
        dataDate = date.toISOString().split('T')[0];
      } else {
        continue;
      }

      // Skip duplicates for same date
      const dateKey = `${dataDate}-${targetRegion}`;
      if (processedDates.has(dateKey)) continue;
      processedDates.add(dateKey);

      // Process each metric column
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

    if (upsertData.length === 0) {
      return NextResponse.json({ 
        error: 'No valid data found to store. Check CSV format and column mappings.' 
      }, { status: 400 });
    }

    console.log(`[Redfin Data] Upserting ${upsertData.length} records...`);

    // Upsert to database
    const { error: upsertError } = await supabase
      .from('redfin_data')
      .upsert(upsertData, { 
        onConflict: 'region,metric_name,data_date' 
      });

    if (upsertError) {
      console.error('[Redfin Data] Database error:', upsertError);
      return NextResponse.json({ 
        error: `Database error: ${upsertError.message}` 
      }, { status: 500 });
    }

    // Get summary of stored data
    const metricCounts: Record<string, number> = {};
    upsertData.forEach(item => {
      metricCounts[item.metric_name] = (metricCounts[item.metric_name] || 0) + 1;
    });

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${upsertData.length} records`,
      region: targetRegion,
      dataType: parsedData.dataType,
      dateRange: {
        start: upsertData[upsertData.length - 1]?.data_date,
        end: upsertData[0]?.data_date
      },
      metrics: Object.keys(metricCounts),
      metricCounts
    });
  } catch (error: any) {
    console.error('[Redfin Data] Error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to process Redfin data' 
    }, { status: 500 });
  }
}
