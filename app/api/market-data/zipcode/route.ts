import { NextResponse } from 'next/server';
import { supabase } from '@/common/lib/supabase-client';
import { fetchAttomMarketData, fetchRedfinMarketStats } from '@/common/lib/api-clients';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const ZIP_CODES = ['89148', '89141', '89044', '89135'];

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const zipCode = searchParams.get('zip');
  
  if (!zipCode) {
    return NextResponse.json({ error: 'Zip code parameter is required' }, { status: 400 });
  }

  if (!ZIP_CODES.includes(zipCode)) {
    return NextResponse.json({ error: `Zip code ${zipCode} is not tracked. Supported: ${ZIP_CODES.join(', ')}` }, { status: 400 });
  }

  try {
    // Fetch DOM and Inventory from database
    const [inventory, dom] = await Promise.all([
      supabase.from('market_metrics')
        .select('value, metric_date')
        .eq('location', zipCode)
        .eq('metric_name', 'inventory')
        .gte('metric_date', '2024-01-01')
        .order('metric_date', { ascending: true })
        .limit(1000),
      supabase.from('market_metrics')
        .select('value, metric_date')
        .eq('location', zipCode)
        .eq('metric_name', 'days_on_market')
        .gte('metric_date', '2024-01-01')
        .order('metric_date', { ascending: true })
        .limit(1000)
    ]);

    // Helper function to normalize date
    const normalizeDate = (dateStr: string | null | undefined): string => {
      if (!dateStr) return '';
      return dateStr.split('T')[0];
    };

    // Helper function to deduplicate by date
    const deduplicateByDate = <T extends { metric_date: string }>(arr: T[]): T[] => {
      const dateMap = new Map<string, T>();
      arr.forEach(item => {
        const normalizedDate = normalizeDate(item.metric_date);
        dateMap.set(normalizedDate, { ...item, metric_date: normalizedDate } as T);
      });
      return Array.from(dateMap.values()).sort((a, b) => 
        new Date(a.metric_date).getTime() - new Date(b.metric_date).getTime()
      );
    };

    const latestInventory = inventory.data?.[inventory.data.length - 1];
    const latestDOM = dom.data?.[dom.data.length - 1];

    return NextResponse.json({
      zipCode,
      latest: {
        inventory: Number(latestInventory?.value || 0),
        dom: Number(latestDOM?.value || 0),
        date: normalizeDate(latestInventory?.metric_date || latestDOM?.metric_date)
      },
      history: {
        inventory: deduplicateByDate(inventory.data?.map(d => ({ value: Number(d.value), date: normalizeDate(d.metric_date) })) || []),
        dom: deduplicateByDate(dom.data?.map(d => ({ value: Number(d.value), date: normalizeDate(d.metric_date) })) || [])
      }
    });
  } catch (error: any) {
    console.error('Error fetching zip code data:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST endpoint to sync/fetch data for a zip code
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { zipCode } = body;
    
    console.log(`[API] POST /api/market-data/zipcode - Received zipCode: ${zipCode}`);
    
    if (!zipCode || !ZIP_CODES.includes(zipCode)) {
      console.error(`[API] Invalid zip code: ${zipCode}`);
      return NextResponse.json({ 
        success: false,
        error: `Valid zip code is required. Supported: ${ZIP_CODES.join(', ')}` 
      }, { status: 400 });
    }

    console.log(`[API] Fetching data for zip code ${zipCode}...`);
    
    // Fetch from APIs
    const [attomData, redfinData] = await Promise.all([
      fetchAttomMarketData(`${zipCode}, NV`).catch(err => {
        console.error(`[API] ATTOM API error for ${zipCode}:`, err.message || err);
        return null;
      }),
      fetchRedfinMarketStats(zipCode).catch(err => {
        console.error(`[API] Redfin API error for ${zipCode}:`, err.message || err);
        return null;
      })
    ]);

    console.log(`[API] API responses for ${zipCode}:`, {
      attom: attomData ? 'Success' : 'Failed/No data',
      redfin: redfinData ? 'Success' : 'Failed/No data',
      attomKeys: attomData ? Object.keys(attomData).slice(0, 5) : null,
      redfinKeys: redfinData ? Object.keys(redfinData).slice(0, 5) : null
    });

    const activeInventory = redfinData?.active_listings || attomData?.inventoryCount;
    const avgDOM = redfinData?.median_days_on_market || attomData?.avgDaysOnMarket;
    const today = new Date().toISOString().split('T')[0];

    console.log(`[API] Extracted values for ${zipCode}:`, {
      inventory: activeInventory,
      dom: avgDOM,
      date: today
    });

    const metrics = [
      { name: 'inventory', value: activeInventory },
      { name: 'days_on_market', value: avgDOM }
    ].filter(m => m.value != null && m.value !== undefined);

    if (metrics.length === 0) {
      console.warn(`[API] No valid metrics found for ${zipCode}`);
      console.warn(`[API] ATTOM response:`, attomData);
      console.warn(`[API] Redfin response:`, redfinData);
      
      // Note: Many APIs don't support zip code-level queries
      // This is expected behavior - zip code data may need to come from other sources
      return NextResponse.json({ 
        success: false,
        error: 'No valid data returned from APIs. The ATTOM and Redfin APIs may not support zip code-level queries. Consider using metro-level data or alternative data sources.',
        zipCode,
        data: {
          inventory: null,
          dom: null,
          date: today
        },
        note: 'Zip code data may require alternative data sources or manual entry. The cron job will continue to attempt syncing.'
      }, { status: 200 }); // Return 200 but with success: false
    }

    console.log(`[API] Upserting ${metrics.length} metrics for ${zipCode}...`);
    
    // Upsert metrics to database
    const upsertResults = [];
    for (const m of metrics) {
      const { error } = await supabase.from('market_metrics').upsert({
        location: zipCode,
        metric_name: m.name,
        value: m.value,
        metric_date: today
      }, { onConflict: 'location,metric_name,metric_date' });
      
      if (error) {
        console.error(`[API] Database error upserting ${m.name} for ${zipCode}:`, error);
        upsertResults.push({ metric: m.name, success: false, error: error.message });
      } else {
        console.log(`[API] Successfully upserted ${m.name} for ${zipCode}`);
        upsertResults.push({ metric: m.name, success: true });
      }
    }

    return NextResponse.json({ 
      success: true, 
      zipCode,
      data: {
        inventory: activeInventory || null,
        dom: avgDOM || null,
        date: today
      },
      upsertResults
    });
  } catch (error: any) {
    console.error('[API] Error syncing zip code data:', error);
    return NextResponse.json({ 
      success: false,
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
}
