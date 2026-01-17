import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from './supabase-client';

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn('GEMINI_API_KEY is missing. AI features will not work.');
}

// Use the experimental Gemini 2.0 Flash model
const MODEL_NAME = 'gemini-2.0-flash-exp';

const genAI = new GoogleGenerativeAI(apiKey || '');

// Default prompt template (fallback if DB doesn't have it)
const DEFAULT_PROMPT_TEMPLATE = `You are an expert real estate investment advisor. 
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

async function getPromptTemplate(): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('llm_prompts')
      .select('prompt_template')
      .eq('prompt_key', 'gemini_housing_analysis')
      .single();

    if (error || !data) {
      console.warn('Prompt not found in database, using default template');
      return DEFAULT_PROMPT_TEMPLATE;
    }

    return data.prompt_template || DEFAULT_PROMPT_TEMPLATE;
  } catch (error) {
    console.error('Error fetching prompt template:', error);
    return DEFAULT_PROMPT_TEMPLATE;
  }
}

function replacePlaceholders(template: string, data: {
  region: string;
  marketMetrics: any;
  economicIndicators: any;
  recentNews: any;
}): string {
  return template
    .replace(/{region}/g, data.region)
    .replace(/{marketMetrics}/g, JSON.stringify(data.marketMetrics, null, 2))
    .replace(/{economicIndicators}/g, JSON.stringify(data.economicIndicators, null, 2))
    .replace(/{recentNews}/g, JSON.stringify(data.recentNews, null, 2));
}

export async function analyzeHousingMarket(data: {
  marketMetrics: any;
  economicIndicators: any;
  recentNews: any;
}) {
  const region = data.marketMetrics.region || 'Las Vegas';
  
  // Fetch prompt template from database
  const promptTemplate = await getPromptTemplate();
  
  // Replace placeholders with actual data
  const prompt = replacePlaceholders(promptTemplate, {
    region,
    marketMetrics: data.marketMetrics,
    economicIndicators: data.economicIndicators,
    recentNews: data.recentNews
  });

  try {
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured in environment variables.');
    }

    // Attempt with primary model
    let result;
    try {
      const model = genAI.getGenerativeModel({ model: MODEL_NAME });
      result = await model.generateContent(prompt);
    } catch (e: any) {
      // If primary model fails with 404, try fallback
      if (e.message?.includes('404') || e.message?.includes('not found')) {
        console.warn(`Model ${MODEL_NAME} not found, falling back to gemini-pro`);
        const fallbackModel = genAI.getGenerativeModel({ model: 'gemini-pro' });
        result = await fallbackModel.generateContent(prompt);
      } else {
        throw e;
      }
    }

    const response = await result.response;
    const text = response.text();
    
    if (!text) {
      throw new Error('Gemini returned an empty response.');
    }

    return text;
  } catch (error: any) {
    console.error('Detailed Gemini API Error:', {
      message: error.message,
      stack: error.stack,
      dataProvided: {
        hasMetrics: !!data.marketMetrics,
        hasIndicators: !!data.economicIndicators,
        newsCount: data.recentNews?.length
      }
    });
    return `Analysis currently unavailable. (Error: ${error.message})`;
  }
}
