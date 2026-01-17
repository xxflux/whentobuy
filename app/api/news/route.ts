import { NextResponse } from 'next/server';
import { supabase } from '@/common/lib/supabase-client';
import { fetchHousingNews } from '@/common/lib/api-clients';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const refresh = searchParams.get('refresh') === 'true';

  try {
    // If refresh is requested, fetch fresh news from NewsAPI
    if (refresh) {
      console.log('Fetching fresh news from NewsAPI...');
      
      // Use broader search queries to get more recent housing/policy news
      const queries = [
        'housing market policy',
        'real estate policy',
        'mortgage rates housing',
        'Las Vegas housing market'
      ];

      const allArticles: any[] = [];
      
      // Fetch news for each query
      for (const query of queries) {
        try {
          const articles = await fetchHousingNews(query);
          if (articles && articles.length > 0) {
            allArticles.push(...articles);
          }
        } catch (error) {
          console.error(`Error fetching news for query "${query}":`, error);
        }
      }

      // Remove duplicates by URL and sort by published date
      const uniqueArticles = Array.from(
        new Map(allArticles.map(article => [article.url, article])).values()
      ).sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

      // Store in database (limit to most recent 50)
      const articlesToStore = uniqueArticles.slice(0, 50);
      for (const article of articlesToStore) {
        try {
          await supabase.from('housing_news').upsert({
            title: article.title,
            description: article.description,
            url: article.url,
            published_at: article.publishedAt,
            source: article.source.name
          }, { onConflict: 'url' });
        } catch (error) {
          console.error('Error upserting article:', error);
        }
      }

      console.log(`Stored ${articlesToStore.length} fresh articles`);
    }

    // Fetch from database (always return cached data, or fresh if just synced)
    const { data, error } = await supabase
      .from('housing_news')
      .select('*')
      .order('published_at', { ascending: false })
      .limit(20);

    if (error) throw error;

    return NextResponse.json({ articles: data || [] });
  } catch (error: any) {
    console.error('Database News Fetch Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
