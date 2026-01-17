import { NextResponse } from 'next/server';
import { supabase } from '@/common/lib/supabase-client';
import { fetchHousingNews } from '@/common/lib/api-clients';

export async function GET(req: Request) {
  try {
    // Always fetch fresh news from NewsAPI (no caching)
    console.log('Fetching fresh news from NewsAPI...');
    
    // Use more specific, targeted queries for housing/policy news
    const queries = [
      '"housing policy" OR "real estate policy"',
      '"mortgage rates" AND (housing OR "real estate")',
      '"Las Vegas" AND ("housing market" OR "real estate")',
      '"federal housing" OR "housing legislation"',
      '"home prices" AND (policy OR regulation)'
    ];

    // Keywords that indicate relevant articles
    const relevantKeywords = [
      'housing', 'real estate', 'mortgage', 'home price', 'property',
      'housing market', 'housing policy', 'real estate policy',
      'federal housing', 'housing legislation', 'housing regulation',
      'Las Vegas', 'Nevada', 'homebuyer', 'homeowner'
    ];

    // Function to check if article is relevant
    const isRelevant = (article: any): boolean => {
      const text = `${article.title} ${article.description || ''}`.toLowerCase();
      return relevantKeywords.some(keyword => text.includes(keyword.toLowerCase()));
    };

    const allArticles: any[] = [];
    
    // Fetch news for each query
    for (const query of queries) {
      try {
        const articles = await fetchHousingNews(query, { daysBack: 30 });
        if (articles && articles.length > 0) {
          // Filter for relevance
          const relevantArticles = articles.filter(isRelevant);
          allArticles.push(...relevantArticles);
          console.log(`Query "${query}": ${articles.length} total, ${relevantArticles.length} relevant`);
        }
      } catch (error) {
        console.error(`Error fetching news for query "${query}":`, error);
      }
    }

    // Remove duplicates by URL and sort by published date
    const uniqueArticles = Array.from(
      new Map(allArticles.map(article => [article.url, article])).values()
    ).sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    // Return fresh articles (limit to most recent 20)
    const articlesToReturn = uniqueArticles.slice(0, 20).map(article => ({
      title: article.title,
      description: article.description,
      url: article.url,
      published_at: article.publishedAt,
      source: article.source.name
    }));

    console.log(`Returning ${articlesToReturn.length} fresh articles`);

    return NextResponse.json({ articles: articlesToReturn });
  } catch (error: any) {
    console.error('News Fetch Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
