'use client';

import React, { useEffect, useState } from 'react';
import { Badge, Button, Spinner } from '@/common/ui';
import { MarketCard } from '@/common/components/market-card';
import { NewsArticle } from '@/common/lib/api-clients';

export default function DashboardPage() {
  const [marketData, setMarketData] = useState<any>(null);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [analysis, setAnalysis] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [marketRes, newsRes] = await Promise.all([
          fetch('/api/market-data').then(res => res.json()),
          fetch('/api/news').then(res => res.json())
        ]);

        setMarketData(marketRes);
        setNews(newsRes.articles || []);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const runAnalysis = async () => {
    setAnalyzing(true);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          marketMetrics: marketData?.lasVegasPrices,
          economicIndicators: marketData?.mortgageRate,
          recentNews: news.slice(0, 5).map(a => a.title)
        })
      });
      const data = await res.json();
      setAnalysis(data.analysis);
    } catch (error) {
      console.error('Analysis failed:', error);
      setAnalysis('Failed to generate analysis. Please check your API keys.');
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 px-4 max-w-7xl">
      <div className="space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20">2026 Housing Tracker</Badge>
              <Badge variant="outline" className="border-amber-500/50 text-amber-600">Sensitive Market</Badge>
            </div>
            <h1 className="text-4xl font-bold tracking-tight">Las Vegas Investment Portal</h1>
            <p className="text-muted-foreground mt-2 max-w-2xl">
              Real-time monitoring of Las Vegas housing trends, federal policy shifts, and AI-powered entry/exit timing.
            </p>
          </div>
          <Button 
            onClick={runAnalysis} 
            disabled={analyzing}
            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
          >
            {analyzing ? (
              <>
                <Spinner className="h-4 w-4 mr-2" />
                Gemini Analyzing...
              </>
            ) : (
              'Get AI Timing Opinion'
            )}
          </Button>
        </div>

        {/* Market Pulse Section */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <MarketCard 
            title="Median Home Price (LV)" 
            value={`$${marketData?.lasVegasPrices?.value?.toLocaleString() || '462,000'}`}
            change={1.5}
            isIncrease={true}
            label="Jan 2026"
          />
          <MarketCard 
            title="30-Yr Mortgage Rate" 
            value={`${marketData?.mortgageRate?.value || '6.8'}%`}
            change={0.2}
            isIncrease={false}
            label="National"
          />
          <MarketCard 
            title="Inventory (Active)" 
            value={marketData?.lasVegasPrices?.inventory?.toLocaleString() || '3,450'}
            change={5.2}
            isIncrease={true}
            label="Las Vegas"
          />
          <MarketCard 
            title="Average Days on Market" 
            value={marketData?.lasVegasPrices?.dom || '42'}
            change={2}
            isIncrease={false}
            label="Las Vegas"
          />
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* AI Analysis Card */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card text-card-foreground rounded-xl border shadow-subtle-md overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <span className="text-xl">✨</span> Gemini Flash Analysis
                </h3>
              </div>
              <div className="p-6">
                {analysis ? (
                  <div className="prose dark:prose-invert max-w-none">
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                      {analysis}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                      <span className="text-2xl">🤖</span>
                    </div>
                    <div>
                      <h4 className="font-medium">Ready for Insight</h4>
                      <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                        Click the button above to have Gemini Flash analyze current data and policy news for your investment strategy.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Price Chart Placeholder */}
            <div className="bg-card text-card-foreground rounded-xl border p-6 shadow-subtle-sm">
              <h3 className="text-lg font-semibold mb-4">Price Trend: Las Vegas</h3>
              <div className="h-64 w-full bg-muted/30 rounded flex items-center justify-center border border-dashed">
                <p className="text-muted-foreground text-sm italic">Chart integration (Recharts) pending data history accumulation...</p>
              </div>
            </div>
          </div>

          {/* News Feed */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Policy & News Feed</h3>
              <Badge variant="secondary">Live</Badge>
            </div>
            <div className="space-y-4">
              {news.length > 0 ? (
                news.slice(0, 6).map((article, i) => (
                  <a 
                    key={i} 
                    href={article.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block group space-y-1 hover:bg-muted/50 p-2 rounded transition-colors"
                  >
                    <p className="text-xs text-muted-foreground flex justify-between">
                      <span>{article.source.name}</span>
                      <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
                    </p>
                    <h4 className="text-sm font-medium leading-snug group-hover:text-primary transition-colors">
                      {article.title}
                    </h4>
                  </a>
                ))
              ) : (
                <div className="text-center py-8 border rounded-lg border-dashed">
                  <p className="text-sm text-muted-foreground">No recent news found.</p>
                </div>
              )}
            </div>
            <Button variant="outline" className="w-full text-xs" size="sm">View All News</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
