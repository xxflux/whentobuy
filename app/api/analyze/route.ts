import { NextResponse } from 'next/server';
import { analyzeHousingMarket } from '@/common/lib/gemini-service';
import { supabase } from '@/common/lib/supabase-client';
import { parseAnalysisResponse } from '@/common/lib/analysis-parser';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const region = data.marketMetrics?.region || 'Las Vegas';
    const analysis = await analyzeHousingMarket(data);
    
    // Parse the analysis to extract structured data
    const parsedData = parseAnalysisResponse(analysis);
    
    // Log parsing results for debugging
    console.log('[Analysis Parse] Extracted data:', {
      sentimentScore: parsedData.marketSentimentScore,
      bestTiming: parsedData.bestTiming,
      hasRegionalFocus: !!parsedData.regionalFocus,
      hasStrategicReasoning: !!parsedData.strategicReasoning
    });
    
    // Save to database
    const executionDate = new Date().toISOString();
    const insertData = {
      region: region,
      execution_date: executionDate,
      full_analysis: analysis,
      market_sentiment_score: parsedData.marketSentimentScore,
      best_timing: parsedData.bestTiming,
      regional_focus: parsedData.regionalFocus,
      strategic_reasoning: parsedData.strategicReasoning,
      created_at: executionDate
    };
    
    console.log('[Analysis Save] Inserting data:', {
      region: insertData.region,
      sentiment: insertData.market_sentiment_score,
      timing: insertData.best_timing,
      hasAnalysis: !!insertData.full_analysis
    });
    
    const { data: insertedData, error: dbError } = await supabase
      .from('gemini_analysis_history')
      .insert(insertData)
      .select()
      .single();

    if (dbError) {
      // If table doesn't exist, log error but don't fail the request
      if (dbError.code === '42P01') {
        console.warn('Table gemini_analysis_history does not exist. Analysis saved but not stored in DB. Run migration to create table.');
      } else {
        console.error('Error saving analysis to database:', dbError);
        console.error('Insert data was:', insertData);
      }
    } else {
      console.log('[Analysis Save] Successfully saved:', {
        id: insertedData?.id,
        sentiment: insertedData?.market_sentiment_score,
        timing: insertedData?.best_timing
      });
    }

    return NextResponse.json({ 
      analysis,
      saved: !dbError,
      parsed: parsedData,
      insertedId: insertedData?.id
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
