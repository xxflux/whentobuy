'use client';

import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Badge, Button, Spinner, Tabs, TabsList, TabsTrigger, Dialog, DialogContent, DialogTrigger } from '@/common/ui';
import { MarketCard } from '@/common/components/market-card';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Legend
} from 'recharts';

export default function DashboardPage() {
  const [marketData, setMarketData] = useState<any>(null);
  const [news, setNews] = useState<any[]>([]);
  const [analysis, setAnalysis] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [refreshingNews, setRefreshingNews] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState('Las Vegas');
  const [promptOpen, setPromptOpen] = useState(false);
  const [promptData, setPromptData] = useState<any>(null);
  const [loadingPrompt, setLoadingPrompt] = useState(false);

  const regions = [
    'Las Vegas',
    'Summerlin',
    'Henderson',
    'Southwest',
    'Enterprise'
  ];

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [marketRes, newsRes] = await Promise.all([
          fetch(`/api/market-data?region=${encodeURIComponent(selectedRegion)}&t=${Date.now()}`, { cache: 'no-store' }).then(res => res.json()),
          fetch(`/api/news?t=${Date.now()}`, { cache: 'no-store' }).then(res => res.json())
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
  }, [selectedRegion]);

  const runAnalysis = async () => {
    setAnalyzing(true);
    try {
      const displayZHVIValue = history?.zhvi?.length > 0 
        ? history.zhvi[history.zhvi.length - 1].value 
        : (latest?.zhvi || 0);

      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          marketMetrics: {
            ...marketData?.latest,
            region: selectedRegion,
            zhvi: displayZHVIValue,
            zori: marketData?.latest?.zori,
            priceCuts: marketData?.latest?.priceCuts
          },
          economicIndicators: marketData?.latest?.mortgage,
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

  if (loading && !marketData) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  const latest = marketData?.latest;
  const history = marketData?.history;

  const displayZHVI = history?.zhvi?.length > 0 
    ? history.zhvi[history.zhvi.length - 1].value 
    : (latest?.zhvi || 0);

  return (
    <div className="container mx-auto py-12 px-4 max-w-7xl">
      <div className="space-y-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 text-sm">2026 Housing Tracker</Badge>
              <Badge variant="outline" className="border-amber-500/50 text-amber-600 text-sm">Sensitive Market</Badge>
            </div>
            <h1 className="text-5xl font-bold tracking-tight">Las Vegas Investment Portal</h1>
            <p className="text-xl text-muted-foreground mt-2 max-w-2xl">
              Real-time monitoring of Las Vegas housing trends, federal policy shifts, and AI-powered entry/exit timing.
            </p>
          </div>
        </div>

        {/* Market Pulse Section - Always Overall Las Vegas */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <MarketCard 
            title="Median Home Price (LV)" 
            value={latest?.price ? `$${latest.price.toLocaleString()}` : '---'}
            change={1.5}
            isIncrease={true}
            label={latest?.date ? new Date(latest.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Current'}
            source="Database (Attom/Redfin)"
            sourceLink="https://www.redfin.com/news/data-center/"
            chartData={history?.prices}
          />
          <MarketCard 
            title="30-Yr Mortgage Rate" 
            value={latest?.mortgage ? `${latest.mortgage}%` : '---'}
            change={0.2}
            isIncrease={false}
            label="National"
            source="Database (FRED)"
            sourceLink="https://fred.stlouisfed.org/series/MORTGAGE30US"
            chartData={history?.mortgage}
          />
          <MarketCard 
            title="Inventory (Active)" 
            value={latest?.inventory ? latest.inventory.toLocaleString() : '---'}
            change={5.2}
            isIncrease={true}
            label="Las Vegas"
            source="Database (Redfin)"
            sourceLink="https://www.redfin.com/news/data-center/"
            chartData={history?.inventory}
          />
          <MarketCard 
            title="Average Days on Market" 
            value={latest?.dom || '---'}
            change={2}
            isIncrease={false}
            label="Las Vegas"
            source="Database (Redfin/Attom)"
            sourceLink="https://www.redfin.com/news/data-center/"
            chartData={history?.dom}
          />
        </div>

        {/* Region Selector and AI Analysis Button - Above Zillow Charts */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Zillow District Trends</h2>
            <Button 
              onClick={runAnalysis} 
              disabled={analyzing}
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg text-base h-12"
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
          <div className="bg-muted/30 p-1 rounded-xl inline-flex overflow-x-auto no-scrollbar max-w-full">
            <Tabs value={selectedRegion} onValueChange={setSelectedRegion} className="w-full">
              <TabsList className="bg-transparent border-none h-auto p-0 gap-1 flex-nowrap w-full">
                {regions.map(region => (
                  <TabsTrigger 
                    key={region} 
                    value={region}
                    className="rounded-lg px-6 py-2 text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm border-none whitespace-nowrap"
                  >
                    {region}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Zillow Home Value Index Chart Section - Region Specific */}
        <div className="bg-card text-card-foreground rounded-xl border p-8 shadow-subtle-md relative">
          {loading && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-xl">
              <Spinner className="h-8 w-8" />
            </div>
          )}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h3 className="text-2xl font-bold">Zillow Home Value Index (ZHVI)</h3>
              <p className="text-muted-foreground mt-1">Single-Family Homes Time Series - {selectedRegion}, NV</p>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">${displayZHVI?.toLocaleString()}</span>
              <Badge variant="secondary" className="text-xs">Official Index</Badge>
            </div>
          </div>
          
          <div className="h-[350px] w-full mt-4">
            {history?.zhvi && history.zhvi.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history.zhvi} margin={{ top: 10, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(str) => {
                      const date = new Date(str);
                      return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
                    }}
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    axisLine={false}
                    tickLine={false}
                    dy={10}
                  />
                  <YAxis 
                    domain={['dataMin - 5000', 'dataMax + 5000']}
                    tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      borderRadius: '8px', 
                      border: '1px solid #e5e7eb',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                    formatter={(value: any) => [`$${value.toLocaleString()}`, 'Value Index']}
                    labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#3b82f6" 
                    strokeWidth={3} 
                    dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full flex flex-col items-center justify-center border-2 border-dashed rounded-xl bg-muted/10">
                <Spinner className="h-8 w-8 mb-4 text-primary/40" />
                <p className="text-muted-foreground font-medium">No region-specific Zillow data found.</p>
                <p className="text-xs text-muted-foreground/60 mt-1 italic">Please ensure data is seeded for {selectedRegion}.</p>
              </div>
            )}
          </div>
          <div className="mt-6 pt-4 border-t flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Data Source:</span>
            <a 
              href="https://www.zillow.com/research/data/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground/80 hover:text-primary transition-colors underline decoration-dotted underline-offset-2"
            >
              Zillow Research (ZHVI Single-Family Home Time Series)
            </a>
          </div>
        </div>

        {/* Rental & Market Sentiment Section - Region Specific */}
        <div className="grid gap-8 md:grid-cols-2">
          {/* Rent Index Chart */}
          <div className="bg-card text-card-foreground rounded-xl border p-8 shadow-subtle-md relative">
            {loading && (
              <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-xl">
                <Spinner className="h-8 w-8" />
              </div>
            )}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-bold">Rent Index (ZORI)</h3>
                <p className="text-muted-foreground mt-1">Monthly Observed Rent - {selectedRegion}</p>
              </div>
              <div className="text-right">
                <span className="text-3xl font-bold">${latest?.zori?.toLocaleString()}</span>
                <p className="text-xs text-muted-foreground">Per Month</p>
              </div>
            </div>

            <div className="mb-6 p-4 bg-muted/30 rounded-lg border border-muted text-sm space-y-3">
              <p><strong>What it is:</strong> Measures changes in local rents over time.</p>
              <p><strong>Why it's useful:</strong> This is a critical metric for your 5-6 year hold period. It helps you calculate your potential <strong>Cap Rate</strong> and ensures rental income is keeping pace with property appreciation.</p>
            </div>

            <div className="h-[250px] w-full">
              {history?.zori && history.zori.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={history.zori}>
                    <defs>
                      <linearGradient id="colorZori" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(str) => new Date(str).toLocaleDateString('en-US', { month: 'short' })}
                      tick={{ fontSize: 11 }}
                      axisLine={false}
                    />
                    <YAxis 
                      domain={['dataMin - 50', 'dataMax + 50']}
                      tickFormatter={(val) => `$${val}`}
                      tick={{ fontSize: 11 }}
                      axisLine={false}
                    />
                    <Tooltip 
                      formatter={(value: any) => [`$${value.toLocaleString()}`, 'Rent Index']}
                      labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    />
                    <Area type="monotone" dataKey="value" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorZori)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full w-full flex items-center justify-center border-2 border-dashed rounded-xl bg-muted/10 italic text-muted-foreground text-sm">
                  Waiting for rent data...
                </div>
              )}
            </div>
            <div className="mt-6 pt-4 border-t flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Source:</span>
              <a 
                href="https://www.zillow.com/research/data/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground/80 hover:text-primary transition-colors underline decoration-dotted underline-offset-2"
              >
                Zillow Research (ZORI)
              </a>
            </div>
          </div>

          {/* Price Cuts Chart */}
          <div className="bg-card text-card-foreground rounded-xl border p-8 shadow-subtle-md relative">
            {loading && (
              <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-xl">
                <Spinner className="h-8 w-8" />
              </div>
            )}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-bold">Price Cut Share</h3>
                <p className="text-muted-foreground mt-1">% of Listings with Price Reductions</p>
              </div>
              <div className="text-right">
                <span className="text-3xl font-bold">{(latest?.priceCuts * 100).toFixed(1)}%</span>
                <p className="text-xs text-muted-foreground">Market Signal</p>
              </div>
            </div>

            <div className="mb-6 p-4 bg-muted/30 rounded-lg border border-muted text-sm space-y-3">
              <p><strong>What it is:</strong> The percentage of active listings that have had a price reduction.</p>
              <p><strong>Why it's useful:</strong> This is a <strong>leading indicator</strong>. A rising share of price cuts signals a cooling market <em>before</em> sale prices drop, helping you time your entry or exit perfectly.</p>
            </div>

            <div className="h-[250px] w-full">
              {history?.priceCuts && history.priceCuts.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={history.priceCuts}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(str) => new Date(str).toLocaleDateString('en-US', { month: 'short' })}
                      tick={{ fontSize: 11 }}
                      axisLine={false}
                    />
                    <YAxis 
                      domain={[0, 'dataMax + 0.1']}
                      tickFormatter={(val) => `${(val * 100).toFixed(0)}%`}
                      tick={{ fontSize: 11 }}
                      axisLine={false}
                    />
                    <Tooltip 
                      formatter={(value: any) => [`${(value * 100).toFixed(1)}%`, 'Price Cuts']}
                      labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    />
                    <Line type="monotone" dataKey="value" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full w-full flex items-center justify-center border-2 border-dashed rounded-xl bg-muted/10 italic text-muted-foreground text-sm">
                  Waiting for sentiment data...
                </div>
              )}
            </div>
            <div className="mt-6 pt-4 border-t flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Source:</span>
              <a 
                href="https://www.zillow.com/research/data/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground/80 hover:text-primary transition-colors underline decoration-dotted underline-offset-2"
              >
                Zillow Research (Price Cuts)
              </a>
            </div>
          </div>
        </div>

        {/* Liquidity & Forecast Section - Region Specific */}
        <div className="grid gap-8 md:grid-cols-2">
          {/* New Listings & Sales Count */}
          <div className="bg-card text-card-foreground rounded-xl border p-8 shadow-subtle-md relative">
            {loading && (
              <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-xl">
                <Spinner className="h-8 w-8" />
              </div>
            )}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-bold">New Listings vs Sales</h3>
                <p className="text-muted-foreground mt-1">Market Liquidity & Volume - {selectedRegion}</p>
              </div>
              <div className="text-right">
                <span className="text-3xl font-bold">{latest?.salesCount?.toLocaleString()}</span>
                <p className="text-xs text-muted-foreground">Sales this month</p>
              </div>
            </div>

            <div className="mb-6 p-4 bg-muted/30 rounded-lg border border-muted text-sm space-y-3">
              <p><strong>What it is:</strong> The volume of new houses hitting the market vs the number of completed sales.</p>
              <p><strong>Why it's useful:</strong> Measures <strong>liquidity</strong>. You want to invest where houses are moving. If sales count drops while listings rise, it signals an oversupply which could pressure prices down.</p>
            </div>

            <div className="h-[250px] w-full">
              {history?.newListings && history.newListings.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={history.newListings.map((d: any, i: number) => ({
                    date: d.date,
                    newListings: d.value,
                    salesCount: history.salesCount[i]?.value || 0
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(str) => new Date(str).toLocaleDateString('en-US', { month: 'short' })}
                      tick={{ fontSize: 11 }}
                      axisLine={false}
                    />
                    <YAxis 
                      tick={{ fontSize: 11 }}
                      axisLine={false}
                    />
                    <Tooltip 
                      labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                    <Bar dataKey="newListings" name="New Listings" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="salesCount" name="Sales Count" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full w-full flex items-center justify-center border-2 border-dashed rounded-xl bg-muted/10 italic text-muted-foreground text-sm">
                  Waiting for volume data...
                </div>
              )}
            </div>
            <div className="mt-6 pt-4 border-t flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Source:</span>
              <a 
                href="https://www.zillow.com/research/data/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground/80 hover:text-primary transition-colors underline decoration-dotted underline-offset-2"
              >
                Zillow Research (Listing & Sales)
              </a>
            </div>
          </div>

          {/* Market Forecasts */}
          <div className="bg-card text-card-foreground rounded-xl border p-8 shadow-subtle-md relative">
            {loading && (
              <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-xl">
                <Spinner className="h-8 w-8" />
              </div>
            )}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-bold">Zillow Home Value Forecast</h3>
                <p className="text-muted-foreground mt-1">1-Year Projected Appreciation</p>
              </div>
              <div className="text-right">
                <span className="text-3xl font-bold text-green-600">{(latest?.forecast * 100).toFixed(1)}%</span>
                <p className="text-xs text-muted-foreground">Projected Growth</p>
              </div>
            </div>

            <div className="mb-6 p-4 bg-muted/30 rounded-lg border border-muted text-sm space-y-3">
              <p><strong>What it is:</strong> Zillow's 1-year prediction for home value growth in the region.</p>
              <p><strong>Why it's useful:</strong> Helps you visualize future equity potential. Factoring this into your 5-6 year hold helps confirm if the location remains a strong "buy and hold" candidate.</p>
            </div>

            <div className="h-[250px] w-full">
              {history?.forecasts && history.forecasts.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={history.forecasts}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(str) => new Date(str).toLocaleDateString('en-US', { month: 'short' })}
                      tick={{ fontSize: 11 }}
                      axisLine={false}
                    />
                    <YAxis 
                      domain={['dataMin - 0.01', 'dataMax + 0.01']}
                      tickFormatter={(val) => `${(val * 100).toFixed(1)}%`}
                      tick={{ fontSize: 11 }}
                      axisLine={false}
                    />
                    <Tooltip 
                      formatter={(value: any) => [`${(value * 100).toFixed(1)}%`, 'Forecast Growth']}
                      labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    />
                    <Line type="stepAfter" dataKey="value" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full w-full flex items-center justify-center border-2 border-dashed rounded-xl bg-muted/10 italic text-muted-foreground text-sm">
                  Waiting for forecast data...
                </div>
              )}
            </div>
            <div className="mt-6 pt-4 border-t flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Source:</span>
              <a 
                href="https://www.zillow.com/research/data/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground/80 hover:text-primary transition-colors underline decoration-dotted underline-offset-2"
              >
                Zillow Research (Forecasts)
              </a>
            </div>
          </div>
        </div>

        {/* AI Analysis and News Feed Section */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* AI Analysis Card */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card text-card-foreground rounded-xl border shadow-subtle-md overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                    <span className="text-2xl">✨</span> Gemini Flash Analysis
                  </h3>
                  <Button
                    variant="outlined"
                    size="sm"
                    onClick={async () => {
                      setLoadingPrompt(true);
                      try {
                        const res = await fetch('/api/prompts');
                        const data = await res.json();
                        setPromptData(data);
                        setPromptOpen(true);
                      } catch (error) {
                        console.error('Failed to fetch prompt:', error);
                      } finally {
                        setLoadingPrompt(false);
                      }
                    }}
                    disabled={loadingPrompt}
                    className="text-xs h-8 bg-white/10 hover:bg-white/20 text-white border-white/20"
                  >
                    {loadingPrompt ? (
                      <>
                        <Spinner className="h-3 w-3 mr-1" />
                        Loading...
                      </>
                    ) : (
                      'Check Prompt'
                    )}
                  </Button>
                  <Dialog open={promptOpen} onOpenChange={setPromptOpen}>
                    <DialogContent
                      ariaTitle="LLM Prompt Template"
                      className="max-w-4xl max-h-[80vh] overflow-y-auto"
                    >
                      <div className="space-y-4">
                        <div>
                          <h2 className="text-2xl font-bold mb-2">Gemini Housing Analysis Prompt</h2>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Badge variant="secondary">Key: {promptData?.prompt_key || 'gemini_housing_analysis'}</Badge>
                            {promptData?.version && (
                              <Badge variant="outline">Version: {promptData.version}</Badge>
                            )}
                            {promptData?.updated_at && (
                              <span className="text-xs">
                                Updated: {new Date(promptData.updated_at).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="bg-muted/30 rounded-lg p-4 border">
                          <pre className="whitespace-pre-wrap text-sm font-mono text-foreground">
                            {promptData?.prompt_template || 'No prompt found'}
                          </pre>
                        </div>
                        <div className="text-xs text-muted-foreground space-y-1">
                          <p><strong>Placeholders:</strong></p>
                          <ul className="list-disc list-inside space-y-1 ml-2">
                            <li><code>{'{region}'}</code> - Selected region name</li>
                            <li><code>{'{marketMetrics}'}</code> - Market metrics JSON</li>
                            <li><code>{'{economicIndicators}'}</code> - Economic indicators JSON</li>
                            <li><code>{'{recentNews}'}</code> - Recent news articles JSON</li>
                          </ul>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
              <div className="p-6">
                {analysis ? (
                  <div className="space-y-4">
                    <div className="prose prose-slate dark:prose-invert max-w-none text-base leading-relaxed">
                      <ReactMarkdown>{analysis}</ReactMarkdown>
                    </div>
                    <div className="pt-4 border-t flex items-center justify-between text-xs text-muted-foreground/60 uppercase tracking-widest font-medium">
                      <span>Model: Gemini 2.0 Flash</span>
                      <span>Analysis for: {selectedRegion}</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                    <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                      <span className="text-3xl">🤖</span>
                    </div>
                    <div>
                      <h4 className="text-xl font-medium">Ready for Insight</h4>
                      <p className="text-base text-muted-foreground max-w-sm mx-auto">
                        Click the button above to have Gemini Flash analyze market data for {selectedRegion} and recent policy news.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* News Feed */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">Synced Policy News</h3>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outlined" 
                  size="sm"
                  onClick={async () => {
                    setRefreshingNews(true);
                    try {
                      const res = await fetch(`/api/news?t=${Date.now()}`, { cache: 'no-store' });
                      const data = await res.json();
                      setNews(data.articles || []);
                    } catch (error) {
                      console.error('Failed to refresh news:', error);
                    } finally {
                      setRefreshingNews(false);
                    }
                  }}
                  disabled={refreshingNews}
                  className="text-xs h-8"
                >
                  {refreshingNews ? (
                    <>
                      <Spinner className="h-3 w-3 mr-1" />
                      Refreshing...
                    </>
                  ) : (
                    'Refresh'
                  )}
                </Button>
                <Badge variant="secondary" className="text-xs">Live</Badge>
              </div>
            </div>
            <div className="space-y-5">
              {news.length > 0 ? (
                news.slice(0, 6).map((article, i) => (
                  <a 
                    key={i} 
                    href={article.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="block group space-y-2 hover:bg-muted/50 p-3 rounded transition-colors border border-transparent hover:border-muted"
                  >
                    <p className="text-sm text-muted-foreground flex justify-between">
                      <span>{article.source}</span>
                      <span>{new Date(article.published_at).toLocaleDateString()}</span>
                    </p>
                    <h4 className="text-base font-medium leading-snug group-hover:text-primary transition-colors">
                      {article.title}
                    </h4>
                  </a>
                ))
              ) : (
                <div className="text-center py-8 border rounded-lg border-dashed">
                  <p className="text-base text-muted-foreground">No cached news found.</p>
                </div>
              )}
            </div>
            <Button variant="outlined" className="w-full text-sm h-10" size="sm">View All News</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
