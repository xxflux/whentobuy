export const FRED_BASE_URL = 'https://api.stlouisfed.org/fred';
export const NEWS_BASE_URL = 'https://newsapi.org/v2';

export interface FredObservation {
  date: string;
  value: string;
}

export interface FredResponse {
  observations: FredObservation[];
}

export async function fetchFredData(seriesId: string, limit: number = 100) {
  const apiKey = process.env.FRED_API_KEY;
  if (!apiKey) {
    throw new Error('FRED_API_KEY is not defined');
  }

  // Calculate start date for filtering (Jan 1, 2025)
  const observationStart = '2025-01-01';

  const url = `${FRED_BASE_URL}/series/observations?series_id=${seriesId}&api_key=${apiKey}&file_type=json&sort_order=desc&limit=${limit}&observation_start=${observationStart}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch FRED data: ${response.statusText}`);
  }

  const data: FredResponse = await response.json();
  return data.observations;
}

export interface NewsArticle {
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  source: {
    name: string;
  };
}

export interface NewsResponse {
  articles: NewsArticle[];
}

export async function fetchHousingNews(query: string = 'housing market policy', options?: { daysBack?: number }) {
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) {
    throw new Error('NEWS_API_KEY is not defined');
  }

  // Calculate date for filtering (default to last 30 days)
  const daysBack = options?.daysBack || 30;
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - daysBack);
  const fromDateStr = fromDate.toISOString().split('T')[0];

  // Use publishedAt sorting and search in title/description for better results
  const url = `${NEWS_BASE_URL}/everything?q=${encodeURIComponent(query)}&apiKey=${apiKey}&sortBy=publishedAt&searchIn=title,description&from=${fromDateStr}&language=en&pageSize=20`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch News data: ${response.statusText}`);
  }

  const data: NewsResponse = await response.json();
  return data.articles || [];
}

/**
 * ATTOM API Client
 * Docs: https://api.developer.attomdata.com/docs
 */
export async function fetchAttomMarketData(location: string = 'Las Vegas, NV') {
  const apiKey = process.env.ATTOMDAT;
  if (!apiKey) {
    throw new Error('ATTOMDAT is not defined');
  }

  // Using market/trend endpoint for aggregate stats
  const url = `https://api.gateway.attomdata.com/propertyapi/v1.0.0/market/trend?address=${encodeURIComponent(location)}`;
  
  const response = await fetch(url, {
    headers: {
      'apikey': apiKey,
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    console.error(`Attom API error: ${response.status}`);
    return null;
  }

  const data = await response.json();
  return data.marketTrends?.[0] || null;
}

/**
 * Redfin5 (RapidAPI) Client
 * Docs: https://rapidapi.com/Champlion/api/redfin5
 */
export async function fetchRedfinMarketStats(location: string = 'Las Vegas') {
  const apiKey = process.env.RAPIDAPI;
  if (!apiKey) {
    throw new Error('RAPIDAPI is not defined');
  }

  // Common endpoint for Redfin RapidAPIs to get region ID first
  // Then get stats. For simplicity, we'll try to find an endpoint that takes a location string directly.
  // Many Redfin APIs use 'market/get-stats' with a regionId. 
  // We'll search for 'Las Vegas' stats.
  
  const url = `https://redfin5.p.rapidapi.com/market/get-stats?location=${encodeURIComponent(location)}`;

  const response = await fetch(url, {
    headers: {
      'x-rapidapi-key': apiKey,
      'x-rapidapi-host': 'redfin5.p.rapidapi.com'
    }
  });

  if (!response.ok) {
    console.error(`Redfin API error: ${response.status}`);
    return null;
  }

  const data = await response.json();
  return data.data || data;
}
