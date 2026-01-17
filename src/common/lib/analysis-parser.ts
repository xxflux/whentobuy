/**
 * Parses Gemini analysis response to extract structured data
 * Expected format:
 * 1. **Market Sentiment Score**: (0-100)
 * 2. **Best Timing**: (text)
 * 3. **Regional Focus ({region})**: (text)
 * 4. **Strategic Reasoning**: (text)
 * 5. JSON metadata block at the end with market_sentiment_score and best_timing
 */
export function parseAnalysisResponse(analysisText: string): {
  marketSentimentScore: number | null;
  bestTiming: string | null;
  regionalFocus: string | null;
  strategicReasoning: string | null;
} {
  const result = {
    marketSentimentScore: null as number | null,
    bestTiming: null as string | null,
    regionalFocus: null as string | null,
    strategicReasoning: null as string | null,
  };

  if (!analysisText) {
    return result;
  }

  // First, try to extract JSON metadata block (most reliable)
  // Try multiple patterns: ```json, ```, or just { ... }
  let jsonBlockMatch = analysisText.match(/```json\s*([\s\S]*?)\s*```/i);
  if (!jsonBlockMatch) {
    jsonBlockMatch = analysisText.match(/```\s*([\s\S]*?)\s*```/i);
  }
  // Also try to find JSON object at the end of the text
  if (!jsonBlockMatch) {
    const jsonObjectMatch = analysisText.match(/\{[\s\S]*"market_sentiment_score"[\s\S]*"best_timing"[\s\S]*\}/i);
    if (jsonObjectMatch) {
      jsonBlockMatch = [null, jsonObjectMatch[0]];
    }
  }
  
  if (jsonBlockMatch && jsonBlockMatch[1]) {
    try {
      const jsonStr = jsonBlockMatch[1].trim();
      const metadata = JSON.parse(jsonStr);
      
      if (metadata.market_sentiment_score !== undefined) {
        const score = typeof metadata.market_sentiment_score === 'number' 
          ? metadata.market_sentiment_score 
          : parseInt(String(metadata.market_sentiment_score), 10);
        if (!isNaN(score) && score >= 0 && score <= 100) {
          result.marketSentimentScore = score;
        }
      }
      
      if (metadata.best_timing) {
        result.bestTiming = String(metadata.best_timing).trim();
      }
    } catch (e) {
      console.warn('Failed to parse JSON metadata, falling back to text extraction:', e);
    }
  }

  // Fallback: Extract Market Sentiment Score from text (if JSON didn't work)
  if (result.marketSentimentScore === null) {
    // Try multiple patterns
    let sentimentMatch = analysisText.match(/\*\*Market Sentiment Score\*\*:\s*(\d+)/i);
    if (!sentimentMatch) {
      sentimentMatch = analysisText.match(/Market Sentiment Score[:\s]+(\d+)/i);
    }
    if (!sentimentMatch) {
      sentimentMatch = analysisText.match(/1\.\s*\*\*Market Sentiment Score\*\*:\s*(\d+)/i);
    }
    if (sentimentMatch) {
      const score = parseInt(sentimentMatch[1], 10);
      if (!isNaN(score) && score >= 0 && score <= 100) {
        result.marketSentimentScore = score;
      }
    }
  }

  // Fallback: Extract Best Timing from text (if JSON didn't work)
  if (result.bestTiming === null) {
    // Try multiple patterns for Best Timing
    let timingMatch = analysisText.match(/\*\*Best Timing\*\*:\s*(.+?)(?=\n\s*\*\*|$)/is);
    if (!timingMatch) {
      timingMatch = analysisText.match(/Best Timing[:\s]+(.+?)(?=\n\s*\*\*|$)/i);
    }
    if (!timingMatch) {
      timingMatch = analysisText.match(/2\.\s*\*\*Best Timing\*\*:\s*(.+?)(?=\n\s*3\.|$)/is);
    }
    if (timingMatch) {
      result.bestTiming = timingMatch[1].trim().replace(/\n+/g, ' ').replace(/\s+/g, ' ').replace(/^[-•]\s*/, '');
    }
  }

  // Extract Regional Focus (handles dynamic region name in title)
  const regionalMatch = analysisText.match(/\*\*Regional Focus[^:]*:\*\*\s*(.+?)(?=\n\s*\*\*|$)/is);
  if (regionalMatch) {
    result.regionalFocus = regionalMatch[1].trim().replace(/\n+/g, ' ').replace(/\s+/g, ' ');
  }

  // Extract Strategic Reasoning (captures until end or next major section)
  const reasoningMatch = analysisText.match(/\*\*Strategic Reasoning\*\*:\s*(.+?)(?=\n\n|\n\s*\*\*|$)/is);
  if (reasoningMatch) {
    result.strategicReasoning = reasoningMatch[1].trim().replace(/\n+/g, ' ').replace(/\s+/g, ' ');
  }

  return result;
}
