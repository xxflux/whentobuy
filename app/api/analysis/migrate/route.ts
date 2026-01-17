import { NextResponse } from 'next/server';
import { supabase } from '@/common/lib/supabase-client';

export async function POST() {
  try {
    // Create the table using Supabase SQL
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS gemini_analysis_history (
          id BIGSERIAL PRIMARY KEY,
          region TEXT NOT NULL,
          execution_date TIMESTAMP WITH TIME ZONE NOT NULL,
          full_analysis TEXT NOT NULL,
          market_sentiment_score INTEGER,
          best_timing TEXT,
          regional_focus TEXT,
          strategic_reasoning TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          CONSTRAINT sentiment_score_check CHECK (market_sentiment_score IS NULL OR (market_sentiment_score >= 0 AND market_sentiment_score <= 100))
        );

        -- Create index for faster queries by region and date
        CREATE INDEX IF NOT EXISTS idx_gemini_analysis_region_date ON gemini_analysis_history(region, execution_date DESC);
        CREATE INDEX IF NOT EXISTS idx_gemini_analysis_execution_date ON gemini_analysis_history(execution_date DESC);
      `
    });

    if (error) {
      // If RPC doesn't exist, try direct SQL execution via raw query
      // Note: This requires direct database access, which may not be available
      // Alternative: Provide SQL for manual execution
      if (error.code === '42883' || error.message?.includes('function') || error.message?.includes('does not exist')) {
        return NextResponse.json({ 
          error: 'Direct SQL execution not available. Please run this SQL manually in your Supabase SQL editor:',
          sql: `
CREATE TABLE IF NOT EXISTS gemini_analysis_history (
  id BIGSERIAL PRIMARY KEY,
  region TEXT NOT NULL,
  execution_date TIMESTAMP WITH TIME ZONE NOT NULL,
  full_analysis TEXT NOT NULL,
  market_sentiment_score INTEGER,
  best_timing TEXT,
  regional_focus TEXT,
  strategic_reasoning TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT sentiment_score_check CHECK (market_sentiment_score IS NULL OR (market_sentiment_score >= 0 AND market_sentiment_score <= 100))
);

-- Create index for faster queries by region and date
CREATE INDEX IF NOT EXISTS idx_gemini_analysis_region_date ON gemini_analysis_history(region, execution_date DESC);
CREATE INDEX IF NOT EXISTS idx_gemini_analysis_execution_date ON gemini_analysis_history(execution_date DESC);
          `.trim()
        }, { status: 400 });
      }
      throw error;
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Table gemini_analysis_history created successfully'
    });
  } catch (error: any) {
    console.error('Error creating table:', error);
    return NextResponse.json({ 
      error: error.message,
      sql: `
CREATE TABLE IF NOT EXISTS gemini_analysis_history (
  id BIGSERIAL PRIMARY KEY,
  region TEXT NOT NULL,
  execution_date TIMESTAMP WITH TIME ZONE NOT NULL,
  full_analysis TEXT NOT NULL,
  market_sentiment_score INTEGER,
  best_timing TEXT,
  regional_focus TEXT,
  strategic_reasoning TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT sentiment_score_check CHECK (market_sentiment_score IS NULL OR (market_sentiment_score >= 0 AND market_sentiment_score <= 100))
);

-- Create index for faster queries by region and date
CREATE INDEX IF NOT EXISTS idx_gemini_analysis_region_date ON gemini_analysis_history(region, execution_date DESC);
CREATE INDEX IF NOT EXISTS idx_gemini_analysis_execution_date ON gemini_analysis_history(execution_date DESC);
      `.trim()
    }, { status: 500 });
  }
}
