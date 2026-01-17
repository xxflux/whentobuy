import { NextResponse } from 'next/server';
import { supabase } from '@/common/lib/supabase-client';

const DEFAULT_PROMPT = `You are an expert real estate investment advisor. 
Analyze the following data for the Las Vegas housing market, focusing specifically on the district of {region} where applicable.

Note: "price", "inventory", and "dom" (days on market) represent overall Las Vegas metrics. 
"zhvi", "zori", "priceCuts", "newListings", "salesCount", and "forecast" specifically represent the district of {region}.

Consolidated Metrics:
{marketMetrics}

Economic Indicators (National/Local):
{economicIndicators}

Recent News & Policy Changes:
{recentNews}

Please provide your analysis in the following format:
1. **Market Sentiment Score**: (0-100, where 100 is extremely bullish/buy now)
2. **Best Timing**: (e.g., Buy now, Wait 6 months, etc.)
3. **Regional Focus ({region})**: (Specific insights about {region} vs the overall Las Vegas market)
4. **Strategic Reasoning**: (Brief explanation of why, considering the 5-6 year hold period and the current political climate/policy changes)

At the end of your response, include a JSON metadata block in the following format (this is required for data storage):
\`\`\`json
{
  "market_sentiment_score": <number 0-100>,
  "best_timing": "<text description>"
}
\`\`\``;

export async function POST() {
  try {
    const { data, error } = await supabase
      .from('llm_prompts')
      .upsert({
        prompt_key: 'gemini_housing_analysis',
        prompt_template: DEFAULT_PROMPT,
        version: 1,
        updated_at: new Date().toISOString()
      }, { 
        onConflict: 'prompt_key',
        returning: 'minimal'
      });

    if (error) {
      // If table doesn't exist, return instructions
      if (error.code === '42P01') {
        return NextResponse.json({ 
          error: 'Table llm_prompts does not exist. Please create it first with the following SQL:',
          sql: `CREATE TABLE IF NOT EXISTS llm_prompts (
            prompt_key TEXT PRIMARY KEY,
            prompt_template TEXT NOT NULL,
            version INTEGER DEFAULT 1,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );`
        }, { status: 400 });
      }
      throw error;
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Prompt seeded successfully',
      prompt_key: 'gemini_housing_analysis'
    });
  } catch (error: any) {
    console.error('Error seeding prompt:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
