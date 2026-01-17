import { NextResponse } from 'next/server';
import { supabase } from '@/common/lib/supabase-client';

const REGIONS = ['Las Vegas', 'Summerlin', 'Henderson', 'Southwest', 'Enterprise'];

export async function GET() {
  try {
    // Fetch New Listings and Sales Count data for all regions
    const [newListingsPromises, salesCountPromises] = await Promise.all([
      REGIONS.map(async (region) => {
        const { data, error } = await supabase
          .from('zillow_new_listings')
          .select('value, indicator_date, region_name')
          .ilike('region_name', region)
          .gte('indicator_date', '2025-01-01')
          .lte('indicator_date', new Date().toISOString().split('T')[0])
          .order('indicator_date', { ascending: true })
          .limit(1000);

        if (error) {
          console.error(`Error fetching New Listings for ${region}:`, error);
          return { region, data: [] };
        }

        return { region, data: data || [] };
      }),
      REGIONS.map(async (region) => {
        const { data, error } = await supabase
          .from('zillow_sales_count')
          .select('value, indicator_date, region_name')
          .ilike('region_name', region)
          .gte('indicator_date', '2025-01-01')
          .lte('indicator_date', new Date().toISOString().split('T')[0])
          .order('indicator_date', { ascending: true })
          .limit(1000);

        if (error) {
          console.error(`Error fetching Sales Count for ${region}:`, error);
          return { region, data: [] };
        }

        return { region, data: data || [] };
      })
    ]);

    const allNewListingsData = await Promise.all(newListingsPromises);
    const allSalesCountData = await Promise.all(salesCountPromises);

    // Transform data to combine all regions by date
    const dateMap = new Map<string, Record<string, any>>();

    // Add new listings data
    allNewListingsData.forEach(({ region, data }) => {
      data.forEach((item: any) => {
        const date = item.indicator_date;
        if (!dateMap.has(date)) {
          dateMap.set(date, { date });
        }
        dateMap.get(date)![`${region}_newListings`] = Number(item.value);
      });
    });

    // Add sales count data
    allSalesCountData.forEach(({ region, data }) => {
      data.forEach((item: any) => {
        const date = item.indicator_date;
        if (!dateMap.has(date)) {
          dateMap.set(date, { date });
        }
        dateMap.get(date)![`${region}_salesCount`] = Number(item.value);
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
    console.error('Error fetching all regions Listings & Sales:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
