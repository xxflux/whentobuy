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
  Legend,
  ComposedChart
} from 'recharts';

// Custom tooltip that sorts districts by value (highest first)
const ZhviTooltip = (props: any) => {
  const { active, payload, label } = props;
  
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  // Sort payload by value (descending - highest first)
  const sortedPayload = [...payload].sort((a: any, b: any) => {
    const aValue = a.value as number || 0;
    const bValue = b.value as number || 0;
    return bValue - aValue;
  });

  return (
    <div style={{
      backgroundColor: '#fff',
      borderRadius: '8px',
      border: '1px solid #e5e7eb',
      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
      padding: '12px'
    }}>
      <p style={{ marginBottom: '8px', fontWeight: 600, fontSize: '14px' }}>
        {new Date(label).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
      </p>
      {sortedPayload.map((entry: any, index: number) => (
        <p key={index} style={{ 
          margin: '4px 0', 
          fontSize: '13px',
          color: entry.color 
        }}>
          <span style={{ fontWeight: 500 }}>{entry.name}:</span>{' '}
          <span style={{ fontWeight: 600 }}>
            ${Number(entry.value).toLocaleString()}
          </span>
        </p>
      ))}
    </div>
  );
};

// Custom tooltip for ZORI that sorts districts by value (highest first)
const ZoriTooltip = (props: any) => {
  const { active, payload, label } = props;
  
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  // Sort payload by value (descending - highest first)
  const sortedPayload = [...payload].sort((a: any, b: any) => {
    const aValue = a.value as number || 0;
    const bValue = b.value as number || 0;
    return bValue - aValue;
  });

  return (
    <div style={{
      backgroundColor: '#fff',
      borderRadius: '8px',
      border: '1px solid #e5e7eb',
      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
      padding: '12px'
    }}>
      <p style={{ marginBottom: '8px', fontWeight: 600, fontSize: '14px' }}>
        {new Date(label).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
      </p>
      {sortedPayload.map((entry: any, index: number) => (
        <p key={index} style={{ 
          margin: '4px 0', 
          fontSize: '13px',
          color: entry.color 
        }}>
          <span style={{ fontWeight: 500 }}>{entry.name}:</span>{' '}
          <span style={{ fontWeight: 600 }}>
            ${Number(entry.value).toLocaleString()}
          </span>
        </p>
      ))}
    </div>
  );
};

// Custom tooltip for Price Cuts that sorts districts by value (highest first)
const PriceCutsTooltip = (props: any) => {
  const { active, payload, label } = props;
  
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  // Sort payload by value (descending - highest first)
  const sortedPayload = [...payload].sort((a: any, b: any) => {
    const aValue = a.value as number || 0;
    const bValue = b.value as number || 0;
    return bValue - aValue;
  });

  return (
    <div style={{
      backgroundColor: '#fff',
      borderRadius: '8px',
      border: '1px solid #e5e7eb',
      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
      padding: '12px'
    }}>
      <p style={{ marginBottom: '8px', fontWeight: 600, fontSize: '14px' }}>
        {new Date(label).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
      </p>
      {sortedPayload.map((entry: any, index: number) => (
        <p key={index} style={{ 
          margin: '4px 0', 
          fontSize: '13px',
          color: entry.color 
        }}>
          <span style={{ fontWeight: 500 }}>{entry.name}:</span>{' '}
          <span style={{ fontWeight: 600 }}>
            {(Number(entry.value) * 100).toFixed(1)}%
          </span>
        </p>
      ))}
    </div>
  );
};

// Custom tooltip for Forecasts that sorts districts by value (highest first)
const ForecastsTooltip = (props: any) => {
  const { active, payload, label } = props;
  
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  // Sort payload by value (descending - highest first)
  const sortedPayload = [...payload].sort((a: any, b: any) => {
    const aValue = a.value as number || 0;
    const bValue = b.value as number || 0;
    return bValue - aValue;
  });

  return (
    <div style={{
      backgroundColor: '#fff',
      borderRadius: '8px',
      border: '1px solid #e5e7eb',
      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
      padding: '12px'
    }}>
      <p style={{ marginBottom: '8px', fontWeight: 600, fontSize: '14px' }}>
        {new Date(label).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
      </p>
      {sortedPayload.map((entry: any, index: number) => (
        <p key={index} style={{ 
          margin: '4px 0', 
          fontSize: '13px',
          color: entry.color 
        }}>
          <span style={{ fontWeight: 500 }}>{entry.name}:</span>{' '}
          <span style={{ fontWeight: 600 }}>
            {(Number(entry.value) * 100).toFixed(1)}%
          </span>
        </p>
      ))}
    </div>
  );
};

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
  const [allRegionsZhvi, setAllRegionsZhvi] = useState<any[]>([]);
  const [loadingZhvi, setLoadingZhvi] = useState(true);
  const [allRegionsZori, setAllRegionsZori] = useState<any[]>([]);
  const [loadingZori, setLoadingZori] = useState(true);
  const [allRegionsPriceCuts, setAllRegionsPriceCuts] = useState<any[]>([]);
  const [loadingPriceCuts, setLoadingPriceCuts] = useState(true);
  const [allRegionsListingsSales, setAllRegionsListingsSales] = useState<any[]>([]);
  const [loadingListingsSales, setLoadingListingsSales] = useState(true);
  const [allRegionsForecasts, setAllRegionsForecasts] = useState<any[]>([]);
  const [loadingForecasts, setLoadingForecasts] = useState(true);

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

  // Fetch all regions ZHVI data
  useEffect(() => {
    async function fetchAllZhvi() {
      setLoadingZhvi(true);
      try {
        const res = await fetch('/api/market-data/zhvi-all', { cache: 'no-store' });
        const data = await res.json();
        setAllRegionsZhvi(data.data || []);
      } catch (error) {
        console.error('Failed to fetch all regions ZHVI:', error);
      } finally {
        setLoadingZhvi(false);
      }
    }

    fetchAllZhvi();
  }, []);

  // Fetch all regions ZORI data
  useEffect(() => {
    async function fetchAllZori() {
      setLoadingZori(true);
      try {
        const res = await fetch('/api/market-data/zori-all', { cache: 'no-store' });
        const data = await res.json();
        setAllRegionsZori(data.data || []);
      } catch (error) {
        console.error('Failed to fetch all regions ZORI:', error);
      } finally {
        setLoadingZori(false);
      }
    }

    fetchAllZori();
  }, []);

  // Fetch all regions Price Cuts data
  useEffect(() => {
    async function fetchAllPriceCuts() {
      setLoadingPriceCuts(true);
      try {
        const res = await fetch('/api/market-data/price-cuts-all', { cache: 'no-store' });
        const data = await res.json();
        setAllRegionsPriceCuts(data.data || []);
      } catch (error) {
        console.error('Failed to fetch all regions Price Cuts:', error);
      } finally {
        setLoadingPriceCuts(false);
      }
    }

    fetchAllPriceCuts();
  }, []);

  // Fetch all regions Listings & Sales data
  useEffect(() => {
    async function fetchAllListingsSales() {
      setLoadingListingsSales(true);
      try {
        const res = await fetch('/api/market-data/listings-sales-all', { cache: 'no-store' });
        const data = await res.json();
        setAllRegionsListingsSales(data.data || []);
      } catch (error) {
        console.error('Failed to fetch all regions Listings & Sales:', error);
      } finally {
        setLoadingListingsSales(false);
      }
    }

    fetchAllListingsSales();
  }, []);

  // Fetch all regions Forecasts data
  useEffect(() => {
    async function fetchAllForecasts() {
      setLoadingForecasts(true);
      try {
        const res = await fetch('/api/market-data/forecasts-all', { cache: 'no-store' });
        const data = await res.json();
        setAllRegionsForecasts(data.data || []);
      } catch (error) {
        console.error('Failed to fetch all regions Forecasts:', error);
      } finally {
        setLoadingForecasts(false);
      }
    }

    fetchAllForecasts();
  }, []);

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

        {/* Region Selector - Above Zillow Charts */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Zillow District Trends</h2>
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

        {/* Zillow Home Value Index Chart Section */}
        <div className="bg-card text-card-foreground rounded-xl border p-8 shadow-subtle-md relative">
          {(loadingZhvi || (selectedRegion !== 'Las Vegas' && loading)) && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-xl">
              <Spinner className="h-8 w-8" />
            </div>
          )}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h3 className="text-2xl font-bold">Zillow Home Value Index (ZHVI)</h3>
              <p className="text-muted-foreground mt-1">
                Single-Family Homes Time Series - {selectedRegion === 'Las Vegas' ? 'All Districts' : selectedRegion}, NV
              </p>
            </div>
            <Badge variant="secondary" className="text-xs">Official Index</Badge>
          </div>
          
          <div className="h-[400px] w-full mt-4">
            {selectedRegion === 'Las Vegas' ? (
              allRegionsZhvi.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={allRegionsZhvi} margin={{ top: 10, right: 30, left: 20, bottom: 20 }}>
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
                  <Tooltip content={<ZhviTooltip />} />
                  <Legend 
                    wrapperStyle={{ paddingTop: '20px' }}
                    iconType="line"
                    formatter={(value) => <span style={{ fontSize: '12px', color: '#6b7280' }}>{value}</span>}
                  />
                  {/* Las Vegas - Blue */}
                  <Line 
                    type="monotone" 
                    dataKey="Las Vegas" 
                    stroke="#3b82f6" 
                    strokeWidth={2.5} 
                    dot={false}
                    activeDot={{ r: 5 }}
                    name="Las Vegas"
                  />
                  {/* Summerlin - Purple */}
                  <Line 
                    type="monotone" 
                    dataKey="Summerlin" 
                    stroke="#8b5cf6" 
                    strokeWidth={2.5} 
                    dot={false}
                    activeDot={{ r: 5 }}
                    name="Summerlin"
                  />
                  {/* Henderson - Green */}
                  <Line 
                    type="monotone" 
                    dataKey="Henderson" 
                    stroke="#10b981" 
                    strokeWidth={2.5} 
                    dot={false}
                    activeDot={{ r: 5 }}
                    name="Henderson"
                  />
                  {/* Southwest - Orange */}
                  <Line 
                    type="monotone" 
                    dataKey="Southwest" 
                    stroke="#f59e0b" 
                    strokeWidth={2.5} 
                    dot={false}
                    activeDot={{ r: 5 }}
                    name="Southwest"
                  />
                  {/* Enterprise - Red */}
                  <Line 
                    type="monotone" 
                    dataKey="Enterprise" 
                    stroke="#ef4444" 
                    strokeWidth={2.5} 
                    dot={false}
                    activeDot={{ r: 5 }}
                    name="Enterprise"
                  />
                </LineChart>
              </ResponsiveContainer>
              ) : (
                <div className="h-full w-full flex flex-col items-center justify-center border-2 border-dashed rounded-xl bg-muted/10">
                  <Spinner className="h-8 w-8 mb-4 text-primary/40" />
                  <p className="text-muted-foreground font-medium">No Zillow data found for districts.</p>
                  <p className="text-xs text-muted-foreground/60 mt-1 italic">Please ensure data is seeded for all districts.</p>
                </div>
              )
            ) : (
              // Single district view
              history?.zhvi && history.zhvi.length > 0 ? (
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
                      formatter={(value: any) => [`$${value.toLocaleString()}`, selectedRegion]}
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
              )
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
            {(loadingZori || (selectedRegion !== 'Las Vegas' && loading)) && (
              <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-xl">
                <Spinner className="h-8 w-8" />
              </div>
            )}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-bold">Rent Index (ZORI)</h3>
                <p className="text-muted-foreground mt-1">
                  Monthly Observed Rent - {selectedRegion === 'Las Vegas' ? 'All Districts' : selectedRegion}, NV
                </p>
              </div>
              <Badge variant="secondary" className="text-xs">Per Month</Badge>
            </div>

            <div className="mb-6 p-4 bg-muted/30 rounded-lg border border-muted text-sm space-y-3">
              <p><strong>What it is:</strong> Measures changes in local rents over time.</p>
              <p><strong>Why it's useful:</strong> This is a critical metric for your 5-6 year hold period. It helps you calculate your potential <strong>Cap Rate</strong> and ensures rental income is keeping pace with property appreciation.</p>
            </div>

            <div className="h-[300px] w-full">
              {selectedRegion === 'Las Vegas' ? (
                allRegionsZori.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={allRegionsZori} margin={{ top: 10, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(str) => new Date(str).toLocaleDateString('en-US', { month: 'short' })}
                      tick={{ fontSize: 11, fill: '#6b7280' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      domain={['dataMin - 50', 'dataMax + 50']}
                      tickFormatter={(val) => `$${val}`}
                      tick={{ fontSize: 11, fill: '#6b7280' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<ZoriTooltip />} />
                    <Legend 
                      wrapperStyle={{ paddingTop: '20px' }}
                      iconType="line"
                      formatter={(value) => <span style={{ fontSize: '12px', color: '#6b7280' }}>{value}</span>}
                    />
                    {/* Las Vegas - Blue */}
                    <Line 
                      type="monotone" 
                      dataKey="Las Vegas" 
                      stroke="#3b82f6" 
                      strokeWidth={2.5} 
                      dot={false}
                      activeDot={{ r: 5 }}
                      name="Las Vegas"
                    />
                    {/* Summerlin - Purple */}
                    <Line 
                      type="monotone" 
                      dataKey="Summerlin" 
                      stroke="#8b5cf6" 
                      strokeWidth={2.5} 
                      dot={false}
                      activeDot={{ r: 5 }}
                      name="Summerlin"
                    />
                    {/* Henderson - Green */}
                    <Line 
                      type="monotone" 
                      dataKey="Henderson" 
                      stroke="#10b981" 
                      strokeWidth={2.5} 
                      dot={false}
                      activeDot={{ r: 5 }}
                      name="Henderson"
                    />
                    {/* Southwest - Orange */}
                    <Line 
                      type="monotone" 
                      dataKey="Southwest" 
                      stroke="#f59e0b" 
                      strokeWidth={2.5} 
                      dot={false}
                      activeDot={{ r: 5 }}
                      name="Southwest"
                    />
                    {/* Enterprise - Red */}
                    <Line 
                      type="monotone" 
                      dataKey="Enterprise" 
                      stroke="#ef4444" 
                      strokeWidth={2.5} 
                      dot={false}
                      activeDot={{ r: 5 }}
                      name="Enterprise"
                    />
                  </LineChart>
                </ResponsiveContainer>
                ) : (
                  <div className="h-full w-full flex flex-col items-center justify-center border-2 border-dashed rounded-xl bg-muted/10">
                    <Spinner className="h-8 w-8 mb-4 text-primary/40" />
                    <p className="text-muted-foreground font-medium">No Zillow rent data found for districts.</p>
                    <p className="text-xs text-muted-foreground/60 mt-1 italic">Please ensure data is seeded for all districts.</p>
                  </div>
                )
              ) : (
                // Single district view
                history?.zori && history.zori.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={history.zori}>
                      <defs>
                        <linearGradient id={`colorZori-${selectedRegion}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(str) => new Date(str).toLocaleDateString('en-US', { month: 'short' })}
                        tick={{ fontSize: 11, fill: '#6b7280' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis 
                        domain={['dataMin - 50', 'dataMax + 50']}
                        tickFormatter={(val) => `$${val}`}
                        tick={{ fontSize: 11, fill: '#6b7280' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip 
                        formatter={(value: any) => [`$${value.toLocaleString()}`, selectedRegion]}
                        labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#8b5cf6" 
                        fillOpacity={1} 
                        fill={`url(#colorZori-${selectedRegion})`} 
                        strokeWidth={2} 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full w-full flex items-center justify-center border-2 border-dashed rounded-xl bg-muted/10 italic text-muted-foreground text-sm">
                    Waiting for rent data...
                  </div>
                )
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
            {(loadingPriceCuts || (selectedRegion !== 'Las Vegas' && loading)) && (
              <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-xl">
                <Spinner className="h-8 w-8" />
              </div>
            )}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-bold">Price Cut Share</h3>
                <p className="text-muted-foreground mt-1">
                  % of Listings with Price Reductions - {selectedRegion === 'Las Vegas' ? 'All Districts' : selectedRegion}, NV
                </p>
              </div>
              <Badge variant="secondary" className="text-xs">Market Signal</Badge>
            </div>

            <div className="mb-6 p-4 bg-muted/30 rounded-lg border border-muted text-sm space-y-3">
              <p><strong>What it is:</strong> The percentage of active listings that have had a price reduction.</p>
              <p><strong>Why it's useful:</strong> This is a <strong>leading indicator</strong>. A rising share of price cuts signals a cooling market <em>before</em> sale prices drop, helping you time your entry or exit perfectly.</p>
            </div>

            <div className="h-[300px] w-full">
              {selectedRegion === 'Las Vegas' ? (
                allRegionsPriceCuts.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={allRegionsPriceCuts} margin={{ top: 10, right: 30, left: 20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(str) => new Date(str).toLocaleDateString('en-US', { month: 'short' })}
                        tick={{ fontSize: 11, fill: '#6b7280' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis 
                        domain={[0, 'dataMax + 0.1']}
                        tickFormatter={(val) => `${(val * 100).toFixed(0)}%`}
                        tick={{ fontSize: 11, fill: '#6b7280' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip content={<PriceCutsTooltip />} />
                      <Legend 
                        wrapperStyle={{ paddingTop: '20px' }}
                        iconType="line"
                        formatter={(value) => <span style={{ fontSize: '12px', color: '#6b7280' }}>{value}</span>}
                      />
                      {/* Las Vegas - Blue */}
                      <Line 
                        type="monotone" 
                        dataKey="Las Vegas" 
                        stroke="#3b82f6" 
                        strokeWidth={2.5} 
                        dot={false}
                        activeDot={{ r: 5 }}
                        name="Las Vegas"
                      />
                      {/* Summerlin - Purple */}
                      <Line 
                        type="monotone" 
                        dataKey="Summerlin" 
                        stroke="#8b5cf6" 
                        strokeWidth={2.5} 
                        dot={false}
                        activeDot={{ r: 5 }}
                        name="Summerlin"
                      />
                      {/* Henderson - Green */}
                      <Line 
                        type="monotone" 
                        dataKey="Henderson" 
                        stroke="#10b981" 
                        strokeWidth={2.5} 
                        dot={false}
                        activeDot={{ r: 5 }}
                        name="Henderson"
                      />
                      {/* Southwest - Orange */}
                      <Line 
                        type="monotone" 
                        dataKey="Southwest" 
                        stroke="#f59e0b" 
                        strokeWidth={2.5} 
                        dot={false}
                        activeDot={{ r: 5 }}
                        name="Southwest"
                      />
                      {/* Enterprise - Red */}
                      <Line 
                        type="monotone" 
                        dataKey="Enterprise" 
                        stroke="#ef4444" 
                        strokeWidth={2.5} 
                        dot={false}
                        activeDot={{ r: 5 }}
                        name="Enterprise"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full w-full flex flex-col items-center justify-center border-2 border-dashed rounded-xl bg-muted/10">
                    <Spinner className="h-8 w-8 mb-4 text-primary/40" />
                    <p className="text-muted-foreground font-medium">No Zillow price cuts data found for districts.</p>
                    <p className="text-xs text-muted-foreground/60 mt-1 italic">Please ensure data is seeded for all districts.</p>
                  </div>
                )
              ) : (
                // Single district view
                history?.priceCuts && history.priceCuts.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={history.priceCuts} margin={{ top: 10, right: 30, left: 20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(str) => new Date(str).toLocaleDateString('en-US', { month: 'short' })}
                        tick={{ fontSize: 11, fill: '#6b7280' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis 
                        domain={[0, 'dataMax + 0.1']}
                        tickFormatter={(val) => `${(val * 100).toFixed(0)}%`}
                        tick={{ fontSize: 11, fill: '#6b7280' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip 
                        formatter={(value: any) => [`${(value * 100).toFixed(1)}%`, selectedRegion]}
                        labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#f59e0b" 
                        strokeWidth={3} 
                        dot={{ r: 4 }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full w-full flex items-center justify-center border-2 border-dashed rounded-xl bg-muted/10 italic text-muted-foreground text-sm">
                    Waiting for sentiment data...
                  </div>
                )
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

        {/* New Listings & Sales Count - Full Width */}
        <div className="bg-card text-card-foreground rounded-xl border p-8 shadow-subtle-md relative">
            {(loadingListingsSales || (selectedRegion !== 'Las Vegas' && loading)) && (
              <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-xl">
                <Spinner className="h-8 w-8" />
              </div>
            )}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-bold">New Listings vs Sales</h3>
                <p className="text-muted-foreground mt-1">
                  Market Liquidity & Volume - {selectedRegion === 'Las Vegas' ? 'All Districts' : selectedRegion}, NV
                </p>
              </div>
              <Badge variant="secondary" className="text-xs">Market Signal</Badge>
            </div>

            <div className="mb-6 p-4 bg-muted/30 rounded-lg border border-muted text-sm space-y-3">
              <p><strong>What it is:</strong> The volume of new houses hitting the market vs the number of completed sales.</p>
              <p><strong>Why it's useful:</strong> Measures <strong>liquidity</strong>. You want to invest where houses are moving. If sales count drops while listings rise, it signals an oversupply which could pressure prices down.</p>
            </div>

            <div className="h-[300px] w-full">
              {selectedRegion === 'Las Vegas' ? (
                allRegionsListingsSales.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={allRegionsListingsSales} margin={{ top: 10, right: 30, left: 20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(str) => new Date(str).toLocaleDateString('en-US', { month: 'short' })}
                        tick={{ fontSize: 11, fill: '#6b7280' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis 
                        yAxisId="left"
                        tick={{ fontSize: 11, fill: '#6b7280' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip 
                        labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        formatter={(value: any, name: any) => {
                          const nameStr = name || '';
                          if (nameStr.includes('_newListings')) {
                            const region = nameStr.replace('_newListings', '');
                            return [value?.toLocaleString() || 0, `${region} - New Listings`];
                          } else if (nameStr.includes('_salesCount')) {
                            const region = nameStr.replace('_salesCount', '');
                            return [value?.toLocaleString() || 0, `${region} - Sales`];
                          }
                          return [value, nameStr];
                        }}
                      />
                      <Legend 
                        iconType="circle" 
                        wrapperStyle={{ fontSize: '11px', paddingTop: '20px' }}
                        formatter={(value) => {
                          if (value.includes('_newListings')) {
                            return value.replace('_newListings', ' - New Listings');
                          } else if (value.includes('_salesCount')) {
                            return value.replace('_salesCount', ' - Sales');
                          }
                          return value;
                        }}
                      />
                      {/* New Listings bars for each district */}
                      <Bar dataKey="Las Vegas_newListings" name="Las Vegas_newListings" fill="#3b82f6" radius={[4, 4, 0, 0]} yAxisId="left" />
                      <Bar dataKey="Summerlin_newListings" name="Summerlin_newListings" fill="#8b5cf6" radius={[4, 4, 0, 0]} yAxisId="left" />
                      <Bar dataKey="Henderson_newListings" name="Henderson_newListings" fill="#10b981" radius={[4, 4, 0, 0]} yAxisId="left" />
                      <Bar dataKey="Southwest_newListings" name="Southwest_newListings" fill="#f59e0b" radius={[4, 4, 0, 0]} yAxisId="left" />
                      <Bar dataKey="Enterprise_newListings" name="Enterprise_newListings" fill="#ef4444" radius={[4, 4, 0, 0]} yAxisId="left" />
                      {/* Sales Count lines for each district */}
                      <Line type="monotone" dataKey="Las Vegas_salesCount" name="Las Vegas_salesCount" stroke="#3b82f6" strokeWidth={2.5} strokeDasharray="5 5" dot={false} />
                      <Line type="monotone" dataKey="Summerlin_salesCount" name="Summerlin_salesCount" stroke="#8b5cf6" strokeWidth={2.5} strokeDasharray="5 5" dot={false} />
                      <Line type="monotone" dataKey="Henderson_salesCount" name="Henderson_salesCount" stroke="#10b981" strokeWidth={2.5} strokeDasharray="5 5" dot={false} />
                      <Line type="monotone" dataKey="Southwest_salesCount" name="Southwest_salesCount" stroke="#f59e0b" strokeWidth={2.5} strokeDasharray="5 5" dot={false} />
                      <Line type="monotone" dataKey="Enterprise_salesCount" name="Enterprise_salesCount" stroke="#ef4444" strokeWidth={2.5} strokeDasharray="5 5" dot={false} />
                    </ComposedChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full w-full flex flex-col items-center justify-center border-2 border-dashed rounded-xl bg-muted/10">
                    <Spinner className="h-8 w-8 mb-4 text-primary/40" />
                    <p className="text-muted-foreground font-medium">No Zillow listings/sales data found for districts.</p>
                    <p className="text-xs text-muted-foreground/60 mt-1 italic">Please ensure data is seeded for all districts.</p>
                  </div>
                )
              ) : (
                // Single district view
                history?.newListings && history.newListings.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={history.newListings.map((d: any, i: number) => ({
                      date: d.date,
                      newListings: d.value,
                      salesCount: history.salesCount[i]?.value || 0
                    }))} margin={{ top: 10, right: 30, left: 20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(str) => new Date(str).toLocaleDateString('en-US', { month: 'short' })}
                        tick={{ fontSize: 11, fill: '#6b7280' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis 
                        tick={{ fontSize: 11, fill: '#6b7280' }}
                        axisLine={false}
                        tickLine={false}
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
                )
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

        {/* Market Forecasts Section */}
        <div className="bg-card text-card-foreground rounded-xl border p-8 shadow-subtle-md relative">
          {(loadingForecasts || (selectedRegion !== 'Las Vegas' && loading)) && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-xl">
              <Spinner className="h-8 w-8" />
            </div>
          )}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-2xl font-bold">Zillow Home Value Forecast</h3>
              <p className="text-muted-foreground mt-1">
                1-Year Projected Appreciation - {selectedRegion === 'Las Vegas' ? 'All Districts' : selectedRegion}, NV
              </p>
            </div>
            <Badge variant="secondary" className="text-xs">Projected Growth</Badge>
          </div>

          <div className="mb-6 p-4 bg-muted/30 rounded-lg border border-muted text-sm space-y-3">
            <p><strong>What it is:</strong> Zillow's 1-year prediction for home value growth in the region.</p>
            <p><strong>Why it's useful:</strong> Helps you visualize future equity potential. Factoring this into your 5-6 year hold helps confirm if the location remains a strong "buy and hold" candidate.</p>
          </div>

          <div className="h-[300px] w-full">
            {selectedRegion === 'Las Vegas' ? (
              allRegionsForecasts.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={allRegionsForecasts} margin={{ top: 10, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(str) => new Date(str).toLocaleDateString('en-US', { month: 'short' })}
                      tick={{ fontSize: 11, fill: '#6b7280' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      domain={['dataMin - 0.01', 'dataMax + 0.01']}
                      tickFormatter={(val) => `${(val * 100).toFixed(1)}%`}
                      tick={{ fontSize: 11, fill: '#6b7280' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<ForecastsTooltip />} />
                    <Legend 
                      wrapperStyle={{ paddingTop: '20px' }}
                      iconType="line"
                      formatter={(value) => <span style={{ fontSize: '12px', color: '#6b7280' }}>{value}</span>}
                    />
                    {/* Las Vegas - Blue */}
                    <Line 
                      type="stepAfter" 
                      dataKey="Las Vegas" 
                      stroke="#3b82f6" 
                      strokeWidth={2.5} 
                      dot={false}
                      activeDot={{ r: 5 }}
                      name="Las Vegas"
                    />
                    {/* Summerlin - Purple */}
                    <Line 
                      type="stepAfter" 
                      dataKey="Summerlin" 
                      stroke="#8b5cf6" 
                      strokeWidth={2.5} 
                      dot={false}
                      activeDot={{ r: 5 }}
                      name="Summerlin"
                    />
                    {/* Henderson - Green */}
                    <Line 
                      type="stepAfter" 
                      dataKey="Henderson" 
                      stroke="#10b981" 
                      strokeWidth={2.5} 
                      dot={false}
                      activeDot={{ r: 5 }}
                      name="Henderson"
                    />
                    {/* Southwest - Orange */}
                    <Line 
                      type="stepAfter" 
                      dataKey="Southwest" 
                      stroke="#f59e0b" 
                      strokeWidth={2.5} 
                      dot={false}
                      activeDot={{ r: 5 }}
                      name="Southwest"
                    />
                    {/* Enterprise - Red */}
                    <Line 
                      type="stepAfter" 
                      dataKey="Enterprise" 
                      stroke="#ef4444" 
                      strokeWidth={2.5} 
                      dot={false}
                      activeDot={{ r: 5 }}
                      name="Enterprise"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full w-full flex flex-col items-center justify-center border-2 border-dashed rounded-xl bg-muted/10">
                  <Spinner className="h-8 w-8 mb-4 text-primary/40" />
                  <p className="text-muted-foreground font-medium">No Zillow forecast data found for districts.</p>
                  <p className="text-xs text-muted-foreground/60 mt-1 italic">Please ensure data is seeded for all districts.</p>
                </div>
              )
            ) : (
              // Single district view
              history?.forecasts && history.forecasts.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={history.forecasts} margin={{ top: 10, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(str) => new Date(str).toLocaleDateString('en-US', { month: 'short' })}
                      tick={{ fontSize: 11, fill: '#6b7280' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      domain={['dataMin - 0.01', 'dataMax + 0.01']}
                      tickFormatter={(val) => `${(val * 100).toFixed(1)}%`}
                      tick={{ fontSize: 11, fill: '#6b7280' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip 
                      formatter={(value: any) => [`${(value * 100).toFixed(1)}%`, selectedRegion]}
                      labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    />
                    <Line 
                      type="stepAfter" 
                      dataKey="value" 
                      stroke="#10b981" 
                      strokeWidth={3} 
                      dot={{ r: 4 }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full w-full flex items-center justify-center border-2 border-dashed rounded-xl bg-muted/10 italic text-muted-foreground text-sm">
                  Waiting for forecast data...
                </div>
              )
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
                  <div className="flex items-center gap-2">
                    <Button 
                      onClick={runAnalysis} 
                      disabled={analyzing}
                      size="lg"
                      className="bg-white hover:bg-white/90 text-blue-600 shadow-lg text-base h-10 px-4"
                    >
                      {analyzing ? (
                        <>
                          <Spinner className="h-4 w-4 mr-2" />
                          Analyzing...
                        </>
                      ) : (
                        'Get AI Timing Opinion'
                      )}
                    </Button>
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
                      className="text-xs h-10 bg-white/10 hover:bg-white/20 text-white border-white/20"
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
                  </div>
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
