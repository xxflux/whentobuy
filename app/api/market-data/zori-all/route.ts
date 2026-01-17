import { NextResponse } from 'next/server';
import { supabase } from '@/common/lib/supabase-client';

const REGIONS = ['Las Vegas', 'Summerlin', 'Henderson', 'Southwest', 'Enterprise'];

export async function GET() {
  try {
    // Fetch ZORI data for all regions
    const regionDataPromises = REGIONS.map(async (region) => {
      const { data, error } = await supabase
        .from('zillow_rent_index')
        .select('value, indicator_date, region_name')
        .ilike('region_name', region)
        .gte('indicator_date', '2025-01-01')
        .lte('indicator_date', new Date().toISOString().split('T')[0])
        .order('indicator_date', { ascending: true })
        .limit(1000);

      if (error) {
        console.error(`Error fetching ZORI for ${region}:`, error);
        return { region, data: [] };
      }

      return { region, data: data || [] };
    });

    const allRegionData = await Promise.all(regionDataPromises);

    // Transform data to combine all regions by date
    const dateMap = new Map<string, Record<string, number>>();

    allRegionData.forEach(({ region, data }) => {
      data.forEach((item: any) => {
        const date = item.indicator_date;
        if (!dateMap.has(date)) {
          dateMap.set(date, { date });
        }
        dateMap.get(date)![region] = Number(item.value);
      });
    });

    // Convert to array and sort by date
    const combinedData = Array.from(dateMap.values()).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    return NextResponse.json({ 
      data: combinedData,
      regions: REGIONS
    });
  } catch (error: any) {
    console.error('Error fetching all regions ZORI:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
