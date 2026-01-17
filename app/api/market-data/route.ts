import { NextResponse } from 'next/server';
import { supabase } from '@/common/lib/supabase-client';
import { fetchFredData, fetchAttomMarketData, fetchRedfinMarketStats } from '@/common/lib/api-clients';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const region = searchParams.get('region') || 'Las Vegas';

  // Normalize region name for database matching
  const normalizedRegion = region.trim();

  try {
    // 1. Fetch Latest & Historical Data from Supabase
    const [
      prices, 
      inventory, 
      dom, 
      mortgage,
      zhvi,
      zori,
      priceCuts,
      newListings,
      salesCount,
      forecasts
    ] = await Promise.all([
      supabase.from('market_metrics')
        .select('value, metric_date')
        .eq('location', 'Las Vegas')
        .eq('metric_name', 'median_sale_price')
        .gte('metric_date', '2025-01-01')
        .order('metric_date', { ascending: true })
        .limit(1000),
      supabase.from('market_metrics')
        .select('value, metric_date')
        .eq('location', 'Las Vegas')
        .eq('metric_name', 'inventory')
        .gte('metric_date', '2025-01-01')
        .order('metric_date', { ascending: true })
        .limit(1000),
      supabase.from('market_metrics')
        .select('value, metric_date')
        .eq('location', 'Las Vegas')
        .eq('metric_name', 'days_on_market')
        .gte('metric_date', '2025-01-01')
        .order('metric_date', { ascending: true })
        .limit(1000),
      supabase.from('economic_indicators')
        .select('value, indicator_date')
        .eq('series_id', 'MORTGAGE30US')
        .gte('indicator_date', '2025-01-01')
        .order('indicator_date', { ascending: true })
        .limit(1000),
      supabase.from('zillow_home_value_index')
        .select('value, indicator_date')
        .ilike('region_name', normalizedRegion)
        .eq('state_name', 'NV')
        .gte('indicator_date', '2025-01-01')
        .lte('indicator_date', new Date().toISOString().split('T')[0])
        .order('indicator_date', { ascending: true })
        .limit(1000),
      supabase.from('zillow_rent_index')
        .select('value, indicator_date')
        .ilike('region_name', normalizedRegion)
        .eq('state_name', 'NV')
        .gte('indicator_date', '2025-01-01')
        .lte('indicator_date', new Date().toISOString().split('T')[0])
        .order('indicator_date', { ascending: true })
        .limit(1000),
      supabase.from('zillow_price_cuts')
        .select('value, indicator_date')
        .ilike('region_name', normalizedRegion)
        .eq('state_name', 'NV')
        .gte('indicator_date', '2025-01-01')
        .lte('indicator_date', new Date().toISOString().split('T')[0])
        .order('indicator_date', { ascending: true })
        .limit(1000),
      supabase.from('zillow_new_listings')
        .select('value, indicator_date')
        .ilike('region_name', normalizedRegion)
        .eq('state_name', 'NV')
        .gte('indicator_date', '2025-01-01')
        .lte('indicator_date', new Date().toISOString().split('T')[0])
        .order('indicator_date', { ascending: true })
        .limit(1000),
      supabase.from('zillow_sales_count')
        .select('value, indicator_date')
        .ilike('region_name', normalizedRegion)
        .eq('state_name', 'NV')
        .gte('indicator_date', '2025-01-01')
        .lte('indicator_date', new Date().toISOString().split('T')[0])
        .order('indicator_date', { ascending: true })
        .limit(1000),
      supabase.from('zillow_forecasts')
        .select('value, indicator_date')
        .ilike('region_name', normalizedRegion)
        .eq('state_name', 'NV')
        .gte('indicator_date', '2025-01-01')
        .order('indicator_date', { ascending: true })
        .limit(1000)
    ]);

    // 2. Initial Seed Logic: If DB is empty for market metrics, pull once from APIs
    if (!prices.data || prices.data.length === 0) {
      const [attomData, redfinData, fredData] = await Promise.all([
        fetchAttomMarketData('Las Vegas, NV'),
        fetchRedfinMarketStats('Las Vegas'),
        fetchFredData('MORTGAGE30US')
      ]);

      const medianPrice = attomData?.medianValue || redfinData?.median_sale_price || 462000;
      const activeInventory = redfinData?.active_listings || attomData?.inventoryCount || 3450;
      const avgDOM = redfinData?.median_days_on_market || attomData?.avgDaysOnMarket || 42;
      const latestMortgage = fredData?.[0]?.value || 6.8;
      const today = new Date().toISOString().split('T')[0];

      // Upsert to Supabase so it's not empty next time
      const metrics = [
        { name: 'median_sale_price', value: medianPrice },
        { name: 'inventory', value: activeInventory },
        { name: 'days_on_market', value: avgDOM }
      ];

      for (const m of metrics) {
        await supabase.from('market_metrics').upsert({
          location: 'Las Vegas',
          metric_name: m.name,
          value: m.value,
          metric_date: today
        }, { onConflict: 'location,metric_name,metric_date' });
      }

      if (fredData?.[0]) {
        await supabase.from('economic_indicators').upsert({
          series_id: 'MORTGAGE30US',
          value: parseFloat(fredData[0].value),
          indicator_date: fredData[0].date
        }, { onConflict: 'series_id,indicator_date' });
      }

      // Return the freshly fetched data for the current request
      return NextResponse.json({
        latest: {
          price: Number(medianPrice),
          inventory: Number(activeInventory),
          dom: Number(avgDOM),
          mortgage: Number(latestMortgage),
          zhvi: Number(zhvi.data?.[zhvi.data.length - 1]?.value || 0),
          zori: Number(zori.data?.[zori.data.length - 1]?.value || 0),
          priceCuts: Number(priceCuts.data?.[priceCuts.data.length - 1]?.value || 0),
          newListings: Number(newListings.data?.[newListings.data.length - 1]?.value || 0),
          salesCount: Number(salesCount.data?.[salesCount.data.length - 1]?.value || 0),
          forecast: Number(forecasts.data?.[forecasts.data.length - 1]?.value || 0),
          date: today
        },
        history: {
          prices: [{ value: Number(medianPrice), date: today }],
          inventory: [{ value: Number(activeInventory), date: today }],
          dom: [{ value: Number(avgDOM), date: today }],
          mortgage: mortgage.data?.map(d => ({ value: Number(d.value), date: d.indicator_date })) || [],
          zhvi: zhvi.data?.map(d => ({ value: Number(d.value), date: d.indicator_date })) || [],
          zori: zori.data?.map(d => ({ value: Number(d.value), date: d.indicator_date })) || [],
          priceCuts: priceCuts.data?.map(d => ({ value: Number(d.value), date: d.indicator_date })) || [],
          newListings: newListings.data?.map(d => ({ value: Number(d.value), date: d.indicator_date })) || [],
          salesCount: salesCount.data?.map(d => ({ value: Number(d.value), date: d.indicator_date })) || [],
          forecasts: forecasts.data?.map(d => ({ value: Number(d.value), date: d.indicator_date })) || []
        }
      });
    }

    // 3. Normal Path: DB has data
    // Log Zillow data counts for debugging
    if (zhvi.error) console.error('ZHVI query error:', zhvi.error);
    if (zori.error) console.error('ZORI query error:', zori.error);
    if (priceCuts.error) console.error('PriceCuts query error:', priceCuts.error);
    if (newListings.error) console.error('NewListings query error:', newListings.error);
    if (salesCount.error) console.error('SalesCount query error:', salesCount.error);
    if (forecasts.error) console.error('Forecasts query error:', forecasts.error);
    
    console.log(`[Market Data] Region: ${normalizedRegion}, ZHVI rows: ${zhvi.data?.length || 0}, ZORI rows: ${zori.data?.length || 0}, PriceCuts rows: ${priceCuts.data?.length || 0}`);
    if (zhvi.data && zhvi.data.length > 0) {
      console.log(`[Market Data] ZHVI date range: ${zhvi.data[0]?.indicator_date} to ${zhvi.data[zhvi.data.length - 1]?.indicator_date}`);
    }

    const latestPrice = prices.data?.[prices.data.length - 1];
    const latestInventory = inventory.data?.[inventory.data.length - 1];
    const latestDOM = dom.data?.[dom.data.length - 1];
    const latestMortgage = mortgage.data?.[mortgage.data.length - 1];
    const latestZHVI = zhvi.data && zhvi.data.length > 0 ? zhvi.data[zhvi.data.length - 1] : null;
    const latestZORI = zori.data && zori.data.length > 0 ? zori.data[zori.data.length - 1] : null;
    const latestPriceCuts = priceCuts.data && priceCuts.data.length > 0 ? priceCuts.data[priceCuts.data.length - 1] : null;
    const latestNewListings = newListings.data && newListings.data.length > 0 ? newListings.data[newListings.data.length - 1] : null;
    const latestSalesCount = salesCount.data && salesCount.data.length > 0 ? salesCount.data[salesCount.data.length - 1] : null;
    const latestForecast = forecasts.data && forecasts.data.length > 0 ? forecasts.data[forecasts.data.length - 1] : null;

    // Helper function to normalize date to YYYY-MM-DD format
    const normalizeDate = (dateStr: string | null | undefined): string => {
      if (!dateStr) return dateStr || '';
      // Extract YYYY-MM-DD from date string (handles both "2025-01-01" and "2025-01-01T00:00:00" formats)
      const dateOnly = dateStr.split('T')[0];
      return dateOnly;
    };

    // Helper function to deduplicate array by date (keep last value for each date)
    const deduplicateByDate = <T extends { date: string }>(arr: T[]): T[] => {
      const dateMap = new Map<string, T>();
      arr.forEach(item => {
        const normalizedDate = normalizeDate(item.date);
        dateMap.set(normalizedDate, { ...item, date: normalizedDate });
      });
      return Array.from(dateMap.values()).sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
    };

    return NextResponse.json({
      latest: {
        price: Number(latestPrice?.value),
        inventory: Number(latestInventory?.value),
        dom: Number(latestDOM?.value),
        mortgage: Number(latestMortgage?.value),
        zhvi: Number(latestZHVI?.value || 0),
        zori: Number(latestZORI?.value || 0),
        priceCuts: Number(latestPriceCuts?.value || 0),
        newListings: Number(latestNewListings?.value || 0),
        salesCount: Number(latestSalesCount?.value || 0),
        forecast: Number(latestForecast?.value || 0),
        date: normalizeDate(latestPrice?.metric_date)
      },
      history: {
        prices: deduplicateByDate(prices.data?.map(d => ({ value: Number(d.value), date: normalizeDate(d.metric_date) })) || []),
        inventory: deduplicateByDate(inventory.data?.map(d => ({ value: Number(d.value), date: normalizeDate(d.metric_date) })) || []),
        dom: deduplicateByDate(dom.data?.map(d => ({ value: Number(d.value), date: normalizeDate(d.metric_date) })) || []),
        mortgage: deduplicateByDate(mortgage.data?.map(d => ({ value: Number(d.value), date: normalizeDate(d.indicator_date) })) || []),
        zhvi: deduplicateByDate(zhvi.data?.map(d => ({ value: Number(d.value), date: normalizeDate(d.indicator_date) })) || []),
        zori: deduplicateByDate(zori.data?.map(d => ({ value: Number(d.value), date: normalizeDate(d.indicator_date) })) || []),
        priceCuts: deduplicateByDate(priceCuts.data?.map(d => ({ value: Number(d.value), date: normalizeDate(d.indicator_date) })) || []),
        newListings: deduplicateByDate(newListings.data?.map(d => ({ value: Number(d.value), date: normalizeDate(d.indicator_date) })) || []),
        salesCount: deduplicateByDate(salesCount.data?.map(d => ({ value: Number(d.value), date: normalizeDate(d.indicator_date) })) || []),
        forecasts: deduplicateByDate(forecasts.data?.map(d => ({ value: Number(d.value), date: normalizeDate(d.indicator_date) })) || [])
      }
    });
  } catch (error: any) {
    console.error('Database Fetch Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
