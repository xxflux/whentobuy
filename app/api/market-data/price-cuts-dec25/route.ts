import { NextResponse } from 'next/server';
import { supabase } from '@/common/lib/supabase-client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const REGIONS = ['Las Vegas', 'Summerlin', 'Henderson', 'Enterprise'];

export async function GET() {
  try {
    const targetDate = '2024-12-25';
    const results: Record<string, any> = {};
    
    // Query each region for Dec 25, 2024 - check a range around that date
    for (const region of REGIONS) {
      // First try exact date
      let { data, error } = await supabase
        .from('zillow_price_cuts')
        .select('value, indicator_date, region_name')
        .ilike('region_name', region)
        .eq('state_name', 'NV')
        .eq('indicator_date', targetDate);
      
      if (error) {
        console.error(`Error for ${region}:`, error);
        results[region] = { error: error.message };
        continue;
      }
      
      // If no exact match, check nearby dates (all of December 2024)
      if (!data || data.length === 0) {
        const { data: rangeData, error: rangeError } = await supabase
          .from('zillow_price_cuts')
          .select('value, indicator_date, region_name')
          .ilike('region_name', region)
          .eq('state_name', 'NV')
          .gte('indicator_date', '2024-12-01')
          .lte('indicator_date', '2024-12-31')
          .order('indicator_date', { ascending: true })
          .limit(100);
        
        if (rangeError) {
          console.error(`Error for ${region} (range):`, rangeError);
          results[region] = { error: rangeError.message };
          continue;
        }
        
        if (rangeData && rangeData.length > 0) {
          // Find closest date to Dec 25
          const targetTime = new Date(targetDate).getTime();
          let closest = rangeData[0];
          let closestDiff = Math.abs(new Date(rangeData[0].indicator_date).getTime() - targetTime);
          
          for (const item of rangeData) {
            const diff = Math.abs(new Date(item.indicator_date).getTime() - targetTime);
            if (diff < closestDiff) {
              closestDiff = diff;
              closest = item;
            }
          }
          
          data = [closest];
        }
      }
      
      if (data && data.length > 0) {
        // If multiple entries, take the latest one
        const latest = data[data.length - 1];
        const actualDate = latest.indicator_date.split('T')[0];
        results[region] = {
          value: Number(latest.value),
          percentage: (Number(latest.value) * 100).toFixed(1) + '%',
          date: actualDate,
          isExact: actualDate === targetDate
        };
      } else {
        results[region] = { value: null, percentage: 'No data' };
      }
    }
    
    return NextResponse.json({ 
      date: targetDate,
      data: results
    });
  } catch (error: any) {
    console.error('Error fetching Dec 25 Price Cuts:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
