import { NextResponse } from 'next/server';
import { supabase } from '@/common/lib/supabase-client';
import { parseAnalysisResponse } from '@/common/lib/analysis-parser';

/**
 * Re-parse existing analyses to extract and update sentiment score and best timing
 * This is useful for analyses created before the parser was updated
 */
export async function POST(req: Request) {
  try {
    const { id } = await req.json();
    
    // If ID is provided, update just that one, otherwise update all
    let query = supabase
      .from('gemini_analysis_history')
      .select('id, full_analysis, market_sentiment_score, best_timing');
    
    if (id) {
      query = query.eq('id', id);
    } else {
      // Only update records where sentiment or timing is null
      query = query.or('market_sentiment_score.is.null,best_timing.is.null');
    }
    
    const { data: analyses, error: fetchError } = await query;
    
    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }
    
    if (!analyses || analyses.length === 0) {
      return NextResponse.json({ 
        message: 'No analyses found to re-parse',
        updated: 0 
      });
    }
    
    let updated = 0;
    const errors: string[] = [];
    
    for (const analysis of analyses) {
      if (!analysis.full_analysis) continue;
      
      // Re-parse the analysis
      const parsedData = parseAnalysisResponse(analysis.full_analysis);
      
      // Only update if we found new data
      if (parsedData.marketSentimentScore !== null || parsedData.bestTiming !== null) {
        const updateData: any = {};
        if (parsedData.marketSentimentScore !== null && analysis.market_sentiment_score === null) {
          updateData.market_sentiment_score = parsedData.marketSentimentScore;
        }
        if (parsedData.bestTiming !== null && !analysis.best_timing) {
          updateData.best_timing = parsedData.bestTiming;
        }
        
        if (Object.keys(updateData).length > 0) {
          const { error: updateError } = await supabase
            .from('gemini_analysis_history')
            .update(updateData)
            .eq('id', analysis.id);
          
          if (updateError) {
            errors.push(`Failed to update analysis ${analysis.id}: ${updateError.message}`);
          } else {
            updated++;
          }
        }
      }
    }
    
    return NextResponse.json({ 
      updated,
      total: analyses.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
