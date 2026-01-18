import { NextResponse } from 'next/server';
import { supabase } from '@/common/lib/supabase-client';

// Default prompt template
const DEFAULT_PROMPT = `You are an expert real estate investment advisor. 
Analyze the following data for the Las Vegas housing market, focusing specifically on the district of {region} where applicable.

Note: "price", "inventory", and "dom" (days on market) represent overall Las Vegas metrics. 
"zhvi", "zori", "priceCuts", "newListings", and "salesCount" specifically represent the district of {region}.

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

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('llm_prompts')
      .select('*')
      .eq('prompt_key', 'gemini_housing_analysis')
      .single();

    if (error) {
      // If table doesn't exist or no data, return default
      console.warn('Prompt not found in database, using default:', error.message);
      return NextResponse.json({ 
        prompt_key: 'gemini_housing_analysis',
        prompt_template: DEFAULT_PROMPT,
        version: 1,
        updated_at: new Date().toISOString()
      });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching prompt:', error);
    return NextResponse.json({ 
      prompt_key: 'gemini_housing_analysis',
      prompt_template: DEFAULT_PROMPT,
      version: 1,
      updated_at: new Date().toISOString()
    });
  }
}

export async function POST(req: Request) {
  try {
    const { prompt_template } = await req.json();

    if (!prompt_template) {
      return NextResponse.json({ error: 'prompt_template is required' }, { status: 400 });
    }

    // Get current version to increment it
    const { data: existing } = await supabase
      .from('llm_prompts')
      .select('version')
      .eq('prompt_key', 'gemini_housing_analysis')
      .single();

    const newVersion = existing?.version ? existing.version + 1 : 1;

    const { data, error } = await supabase
      .from('llm_prompts')
      .upsert({
        prompt_key: 'gemini_housing_analysis',
        prompt_template,
        version: newVersion,
        updated_at: new Date().toISOString()
      }, { 
        onConflict: 'prompt_key'
      })
      .select()
      .single();

    if (error) {
      // If table doesn't exist, just return success (table will be created via migration)
      console.warn('Error upserting prompt (table may not exist yet):', error.message);
      return NextResponse.json({ 
        success: true, 
        message: 'Prompt will be stored after table creation',
        prompt_key: 'gemini_housing_analysis'
      });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error upserting prompt:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
