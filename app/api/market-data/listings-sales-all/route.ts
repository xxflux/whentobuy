import { NextResponse } from 'next/server';
import { supabase } from '@/common/lib/supabase-client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const REGIONS = ['Las Vegas', 'Summerlin', 'Henderson', 'Enterprise'];

export async function GET() {
  try {
    // Fetch New Listings and Sales Count data for all regions
    const [newListingsPromises, salesCountPromises] = await Promise.all([
      REGIONS.map(async (region) => {
        const { data, error } = await supabase
          .from('zillow_new_listings')
          .select('value, indicator_date, region_name')
          .ilike('region_name', region)
          .eq('state_name', 'NV')
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
          .eq('state_name', 'NV')
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

    // Helper function to normalize date to YYYY-MM-DD format
    const normalizeDate = (dateStr: string): string => {
      if (!dateStr) return dateStr;
      // Extract YYYY-MM-DD from date string (handles both "2025-01-01" and "2025-01-01T00:00:00" formats)
      const dateOnly = dateStr.split('T')[0];
      return dateOnly;
    };

    // Add new listings data
    allNewListingsData.forEach(({ region, data }) => {
      // Deduplicate by date for each region (keep the latest value if duplicates exist)
      const regionDateMap = new Map<string, number>();
      data.forEach((item: any) => {
        const date = normalizeDate(item.indicator_date);
        if (date) {
          // Keep the latest value for each date (since data is ordered ascending)
          regionDateMap.set(date, Number(item.value));
        }
      });
      
      // Now add to the main dateMap
      regionDateMap.forEach((value, date) => {
        if (!dateMap.has(date)) {
          dateMap.set(date, { date });
        }
        dateMap.get(date)![`${region}_newListings`] = value;
      });
    });

    // Add sales count data
    allSalesCountData.forEach(({ region, data }) => {
      // Deduplicate by date for each region (keep the latest value if duplicates exist)
      const regionDateMap = new Map<string, number>();
      data.forEach((item: any) => {
        const date = normalizeDate(item.indicator_date);
        if (date) {
          // Keep the latest value for each date (since data is ordered ascending)
          regionDateMap.set(date, Number(item.value));
        }
      });
      
      // Now add to the main dateMap
      regionDateMap.forEach((value, date) => {
        if (!dateMap.has(date)) {
          dateMap.set(date, { date });
        }
        dateMap.get(date)![`${region}_salesCount`] = value;
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
