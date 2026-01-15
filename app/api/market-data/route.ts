import { NextResponse } from 'next/server';
import { fetchFredData, fetchAttomMarketData, fetchRedfinMarketStats } from '@/common/lib/api-clients';
import { supabase } from '@/common/lib/supabase-client';

export async function GET() {
  try {
    // 1. Fetch 30-year mortgage rate (MORTGAGE30US) from FRED
    const mortgageData = await fetchFredData('MORTGAGE30US');
    
    // 2. Fetch Real Market Data from Attom & Redfin
    const [attomData, redfinData] = await Promise.all([
      fetchAttomMarketData('Las Vegas, NV'),
      fetchRedfinMarketStats('Las Vegas')
    ]);

    // Format the consolidated market data
    const lasVegasPrices = {
      medianPrice: attomData?.medianValue || redfinData?.median_sale_price || 462000,
      inventory: redfinData?.active_listings || attomData?.inventoryCount || 3450,
      dom: redfinData?.median_days_on_market || attomData?.avgDaysOnMarket || 42,
      date: new Date().toISOString().split('T')[0]
    };

    // Try to save to Supabase
    if (mortgageData && mortgageData.length > 0) {
      const latest = mortgageData[0];
      await supabase.from('economic_indicators').insert({
        series_id: 'MORTGAGE30US',
        value: parseFloat(latest.value),
        indicator_date: latest.date
      });
    }

    if (attomData || redfinData) {
      await supabase.from('market_metrics').insert({
        location: 'Las Vegas',
        metric_name: 'median_sale_price',
        value: lasVegasPrices.medianPrice,
        metric_date: lasVegasPrices.date
      });
    }

    return NextResponse.json({
      mortgageRate: mortgageData?.[0],
      lasVegasPrices: {
        value: lasVegasPrices.medianPrice,
        inventory: lasVegasPrices.inventory,
        dom: lasVegasPrices.dom,
        date: lasVegasPrices.date
      },
      history: {
        mortgage: mortgageData,
        attomRaw: attomData,
        redfinRaw: redfinData
      }
    });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
