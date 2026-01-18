import { NextResponse } from 'next/server';
import { supabase } from '@/common/lib/supabase-client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const ZIP_CODES = ['89148', '89141', '89044', '89135'];

export async function GET() {
  try {
    // Fetch DOM and Inventory for all zip codes
    const zipCodeDataPromises = ZIP_CODES.map(async (zipCode) => {
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

      return {
        zipCode,
        inventory: {
          latest: inventory.data?.[inventory.data.length - 1] ? Number(inventory.data[inventory.data.length - 1].value) : null,
          history: deduplicateByDate(inventory.data?.map(d => ({ value: Number(d.value), date: normalizeDate(d.metric_date) })) || [])
        },
        dom: {
          latest: dom.data?.[dom.data.length - 1] ? Number(dom.data[dom.data.length - 1].value) : null,
          history: deduplicateByDate(dom.data?.map(d => ({ value: Number(d.value), date: normalizeDate(d.metric_date) })) || [])
        }
      };
    });

    const allZipCodeData = await Promise.all(zipCodeDataPromises);

    return NextResponse.json({ 
      data: allZipCodeData,
      zipCodes: ZIP_CODES
    });
  } catch (error: any) {
    console.error('Error fetching all zip codes data:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
