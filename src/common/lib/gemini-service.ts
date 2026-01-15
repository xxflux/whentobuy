import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn('GEMINI_API_KEY is missing. AI features will not work.');
}

const genAI = new GoogleGenerativeAI(apiKey || '');

export async function analyzeHousingMarket(data: {
  marketMetrics: any;
  economicIndicators: any;
  recentNews: any;
}) {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `
    You are an expert real estate investment advisor. 
    Analyze the following data for the Las Vegas housing market and provide a strategic recommendation for someone looking to buy a single-family home to hold for 5-6 years and then sell or rent.

    Market Metrics (Las Vegas):
    ${JSON.stringify(data.marketMetrics, null, 2)}

    Economic Indicators (National/Local):
    ${JSON.stringify(data.economicIndicators, null, 2)}

    Recent News & Policy Changes:
    ${JSON.stringify(data.recentNews, null, 2)}

    Please provide your analysis in the following format:
    1. **Market Sentiment Score**: (0-100, where 100 is extremely bullish/buy now)
    2. **Best Timing**: (e.g., Buy now, Wait 6 months, etc.)
    3. **Best Location Focus**: (Recommendations for specific areas like Summerlin, Henderson, etc., based on general knowledge if not in data)
    4. **Strategic Reasoning**: (Brief explanation of why, considering the 5-6 year hold period and the current political climate/policy changes)
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    return 'Analysis currently unavailable.';
  }
}
