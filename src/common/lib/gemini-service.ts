import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn('GEMINI_API_KEY is missing. AI features will not work.');
}

// Use the experimental Gemini 2.0 Flash model
const MODEL_NAME = 'gemini-2.0-flash-exp';

const genAI = new GoogleGenerativeAI(apiKey || '');

export async function analyzeHousingMarket(data: {
  marketMetrics: any;
  economicIndicators: any;
  recentNews: any;
}) {
  const region = data.marketMetrics.region || 'Las Vegas';
  const prompt = `
    You are an expert real estate investment advisor. 
    Analyze the following data for the Las Vegas housing market, focusing specifically on the district of ${region} where applicable.
    
    Note: "price", "inventory", and "dom" (days on market) represent overall Las Vegas metrics. 
    "zhvi", "zori", "priceCuts", "newListings", "salesCount", and "forecast" specifically represent the district of ${region}.

    Consolidated Metrics:
    ${JSON.stringify(data.marketMetrics, null, 2)}

    Economic Indicators (National/Local):
    ${JSON.stringify(data.economicIndicators, null, 2)}

    Recent News & Policy Changes:
    ${JSON.stringify(data.recentNews, null, 2)}

    Please provide your analysis in the following format:
    1. **Market Sentiment Score**: (0-100, where 100 is extremely bullish/buy now)
    2. **Best Timing**: (e.g., Buy now, Wait 6 months, etc.)
    3. **Regional Focus (${region})**: (Specific insights about ${region} vs the overall Las Vegas market)
    4. **Strategic Reasoning**: (Brief explanation of why, considering the 5-6 year hold period and the current political climate/policy changes)
  `;

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
