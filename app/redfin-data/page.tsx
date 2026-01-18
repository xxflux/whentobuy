'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Badge, Button, Spinner } from '@/common/ui';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';

export default function RedfinDataPage() {
  const [redfinData, setRedfinData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<string>('');
  const [tableauLoading, setTableauLoading] = useState(true);
  const tableauContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log('[RedfinData] Component mounted, fetching data...');
    fetchRedfinData();
  }, []);

  useEffect(() => {
    console.log('[Tableau] useEffect triggered');
    console.log('[Tableau] typeof window:', typeof window);
    console.log('[Tableau] tableauContainerRef.current:', tableauContainerRef.current);
    
    if (typeof window === 'undefined') {
      console.warn('[Tableau] Window not available, skipping initialization');
      return;
    }

    // Wait for ref to be attached to DOM element
    const waitForRef = (): Promise<HTMLDivElement> => {
      return new Promise((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 20; // Try for 2 seconds (20 * 100ms)
        
        const checkRef = () => {
          attempts++;
          console.log(`[Tableau] Checking ref (attempt ${attempts}/${maxAttempts}):`, tableauContainerRef.current);
          
          if (tableauContainerRef.current) {
            console.log('[Tableau] Ref found!');
            resolve(tableauContainerRef.current);
          } else if (attempts >= maxAttempts) {
            console.error('[Tableau] Ref not found after max attempts');
            reject(new Error('Tableau container ref not found'));
          } else {
            setTimeout(checkRef, 100);
          }
        };
        
        checkRef();
      });
    };

    // Load Tableau script if not already loaded
    const loadTableauScript = (): Promise<void> => {
      console.log('[Tableau] loadTableauScript called');
      return new Promise((resolve) => {
        // Check if script already exists
        const existingScript = document.querySelector('script[src="https://public.tableau.com/javascripts/api/viz_v1.js"]');
        if (existingScript) {
          console.log('[Tableau] Script already exists in DOM');
          resolve();
          return;
        }

        console.log('[Tableau] Creating new script element');
        const scriptElement = document.createElement('script');
        scriptElement.src = 'https://public.tableau.com/javascripts/api/viz_v1.js';
        scriptElement.async = true;
        scriptElement.onload = () => {
          console.log('[Tableau] Script loaded successfully');
          resolve();
        };
        scriptElement.onerror = (error) => {
          console.error('[Tableau] Failed to load Tableau script:', error);
          resolve(); // Resolve anyway to continue
        };
        document.body.appendChild(scriptElement);
        console.log('[Tableau] Script element appended to body');
      });
    };

    const initTableau = async (divElement: HTMLDivElement) => {
      console.log('[Tableau] initTableau called with divElement:', divElement);
      try {
        console.log('[Tableau] Loading Tableau script...');
        await loadTableauScript();
        
        console.log('[Tableau] Waiting 1 second for script initialization...');
        // Wait for script to initialize
        await new Promise(resolve => setTimeout(resolve, 1000));

        console.log('[Tableau] Looking for object element in divElement...');
        const vizElement = divElement.querySelector('object');
        console.log('[Tableau] vizElement found:', !!vizElement);
        console.log('[Tableau] vizElement:', vizElement);
        console.log('[Tableau] divElement children count:', divElement.children.length);
        console.log('[Tableau] divElement children:', Array.from(divElement.children).map(c => c.tagName));
        
        if (vizElement) {
          console.log('[Tableau] Making object visible...');
          // Make object visible
          (vizElement as HTMLElement).style.display = 'block';
          
          // Calculate responsive dimensions
          const containerWidth = divElement.offsetWidth || 800;
          let height = 750;
          
          if (containerWidth > 800) {
            height = Math.floor(containerWidth * 0.75);
          } else if (containerWidth > 500) {
            height = Math.floor(containerWidth * 0.75);
          }
          
          (vizElement as HTMLElement).style.width = '100%';
          (vizElement as HTMLElement).style.height = `${height}px`;
          
          console.log('[Tableau] Visualization initialized successfully', { 
            width: containerWidth, 
            height,
            objectDisplay: (vizElement as HTMLElement).style.display,
            objectWidth: (vizElement as HTMLElement).style.width,
            objectHeight: (vizElement as HTMLElement).style.height
          });
          setTableauLoading(false);
        } else {
          console.warn('[Tableau] Object element not found in divElement');
          console.warn('[Tableau] divElement.innerHTML:', divElement.innerHTML.substring(0, 500));
          setTableauLoading(false);
        }
      } catch (error) {
        console.error('[Tableau] Error initializing Tableau:', error);
        setTableauLoading(false);
      }
    };

    // Wait for ref, then initialize
    waitForRef()
      .then((divElement) => {
        console.log('[Tableau] Ref is ready, starting initialization');
        // Small delay to ensure DOM is fully ready
        setTimeout(() => {
          initTableau(divElement);
        }, 200);
      })
      .catch((error) => {
        console.error('[Tableau] Failed to get ref:', error);
        setTableauLoading(false);
      });
  }, []);

  const fetchRedfinData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/market-data/redfin?region=Las Vegas', { cache: 'no-store' });
      const data = await res.json();
      setRedfinData(data);
      
      // Set first available metric as default
      if (data.metrics && Object.keys(data.metrics).length > 0 && !selectedMetric) {
        setSelectedMetric(Object.keys(data.metrics)[0]);
      }
    } catch (error) {
      console.error('Failed to fetch Redfin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const syncRedfinData = async () => {
    setSyncing(true);
    try {
      // Note: This requires a CSV URL from Redfin Data Center
      // In production, you would either:
      // 1. Store CSV URLs in environment variables
      // 2. Allow users to paste CSV URLs
      // 3. Automatically fetch from known Redfin Data Center endpoints
      
      const csvUrl = prompt('Enter Redfin Data Center CSV URL:');
      if (!csvUrl) {
        setSyncing(false);
        return;
      }

      const res = await fetch('/api/market-data/redfin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          csvUrl,
          region: 'Las Vegas',
          regionType: 'metro'
        })
      });

      const result = await res.json();
      if (result.success) {
        alert(`Successfully imported ${result.message}`);
        await fetchRedfinData();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error: any) {
      console.error('Failed to sync Redfin data:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setSyncing(false);
    }
  };

  if (loading && !redfinData) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  const availableMetrics = redfinData?.metrics ? Object.keys(redfinData.metrics) : [];
  const chartData = selectedMetric && redfinData?.metrics?.[selectedMetric] 
    ? redfinData.metrics[selectedMetric].map((item: any) => ({
        date: item.date,
        value: item.value
      }))
    : [];

  const formatValue = (value: number, metric: string) => {
    if (metric.includes('price') || metric.includes('Price')) {
      return `$${value.toLocaleString()}`;
    }
    if (metric.includes('ratio') || metric.includes('Ratio')) {
      return `${(value * 100).toFixed(1)}%`;
    }
    return value.toLocaleString();
  };

  return (
    <div className="container mx-auto py-12 px-4 max-w-7xl">
      <div className="space-y-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className="bg-red-500/10 text-red-500 hover:bg-red-500/20 text-sm">Redfin Data Tracker</Badge>
              {redfinData?.latest && (
                <Badge variant="outline" className="text-sm">
                  Last updated: {new Date(redfinData.latest.date).toLocaleDateString()}
                </Badge>
              )}
            </div>
            <h1 className="text-5xl font-bold tracking-tight">Redfin Data</h1>
            <p className="text-xl text-muted-foreground mt-2 w-full">
              Market data and analytics from Redfin Data Center
            </p>
            <p className="text-sm text-muted-foreground mt-3 max-w-3xl">
              Data sourced from <a href="https://www.redfin.com/news/data-center/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Redfin Data Center</a>. 
              Weekly data is updated every Wednesday, monthly data on the third Friday of each month.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              onClick={syncRedfinData}
              disabled={syncing}
              variant="outlined"
              size="lg"
            >
              {syncing ? (
                <>
                  <Spinner className="h-4 w-4 mr-2" />
                  Syncing...
                </>
              ) : (
                'Import CSV Data'
              )}
            </Button>
            <Button 
              onClick={fetchRedfinData}
              disabled={loading}
              variant="outlined"
              size="lg"
            >
              {loading ? (
                <>
                  <Spinner className="h-4 w-4 mr-2" />
                  Loading...
                </>
              ) : (
                'Refresh'
              )}
            </Button>
          </div>
        </div>

        {/* Redfin Tableau Visualization */}
        <div className="bg-card text-card-foreground rounded-xl border p-8 shadow-subtle-md">
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2">New Listing Median Price - Las Vegas Metro</h2>
            <p className="text-muted-foreground text-sm">
              Interactive visualization from Redfin Data Center tracking median listing prices in the Las Vegas, NV metro area.
            </p>
          </div>
          <div className="relative w-full" style={{ minHeight: '600px' }}>
            {tableauLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted/10 rounded-lg z-10">
                <div className="text-center">
                  <Spinner className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Loading Tableau visualization...</p>
                </div>
              </div>
            )}
            <div 
              ref={tableauContainerRef}
              id="viz1768752935900" 
              className="w-full"
              style={{ position: 'relative', minHeight: '600px' }}
            >
              <noscript>
                <a href="#">
                  <img alt=" " src="https://public.tableau.com/static/images/GN/GNG2955DW/1_rss.png" style={{ border: 'none' }} />
                </a>
              </noscript>
              <object 
                className="tableauViz" 
                style={{ display: 'none', width: '100%', height: '750px' }}
              >
                <param name="host_url" value="https://public.tableau.com/" />
                <param name="embed_code_version" value="3" />
                <param name="path" value="shared/GNG2955DW" />
                <param name="toolbar" value="yes" />
                <param name="static_image" value="https://public.tableau.com/static/images/GN/GNG2955DW/1.png" />
                <param name="animate_transition" value="yes" />
                <param name="display_static_image" value="yes" />
                <param name="display_spinner" value="yes" />
                <param name="display_overlay" value="yes" />
                <param name="display_count" value="yes" />
                <param name="language" value="en-US" />
              </object>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Source:</span>
            <a 
              href="https://www.redfin.com/news/data-center/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground/80 hover:text-primary transition-colors underline decoration-dotted underline-offset-2"
            >
              Redfin Data Center
            </a>
            <span className="text-xs text-muted-foreground/60">•</span>
            <span className="text-xs text-muted-foreground/60">
              Data provided by Redfin, a national real estate brokerage
            </span>
          </div>
        </div>

        {/* Data Status */}
        {!redfinData || availableMetrics.length === 0 ? (
          <div className="bg-card text-card-foreground rounded-xl border p-8 shadow-subtle-md">
            <div className="text-center py-12">
              <p className="text-lg font-medium text-muted-foreground mb-4">
                No Redfin data available
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                Click "Import CSV Data" to import data from Redfin Data Center CSV files.
              </p>
              <div className="bg-muted/30 rounded-lg p-4 text-left max-w-2xl mx-auto text-sm space-y-2">
                <p><strong>How to import data:</strong></p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Visit <a href="https://www.redfin.com/news/data-center/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Redfin Data Center</a></li>
                  <li>Select your filters (Metro: Las Vegas, etc.)</li>
                  <li>Click the download button to get the CSV URL</li>
                  <li>Paste the CSV URL when prompted</li>
                </ol>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Metrics Overview Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {availableMetrics.slice(0, 4).map((metric) => {
                const metricData = redfinData.metrics[metric];
                const latest = metricData?.[metricData.length - 1];
                const previous = metricData?.[metricData.length - 2];
                const change = latest && previous 
                  ? ((latest.value - previous.value) / previous.value) * 100 
                  : null;

                return (
                  <div key={metric} className="bg-card text-card-foreground rounded-xl border p-6 shadow-subtle-md">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                        {metric.replace(/_/g, ' ')}
                      </h3>
                      {change !== null && (
                        <Badge 
                          variant={change >= 0 ? "default" : "secondary"}
                          className={change >= 0 ? "bg-green-500/10 text-green-600" : ""}
                        >
                          {change >= 0 ? '+' : ''}{change.toFixed(1)}%
                        </Badge>
                      )}
                    </div>
                    <p className="text-3xl font-bold">
                      {latest ? formatValue(latest.value, metric) : '---'}
                    </p>
                    {latest && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(latest.date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Metric Selector */}
            {availableMetrics.length > 0 && (
              <div className="bg-card text-card-foreground rounded-xl border p-6 shadow-subtle-md">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">Metric Trends</h2>
                  <select
                    value={selectedMetric}
                    onChange={(e) => setSelectedMetric(e.target.value)}
                    className="px-4 py-2 border rounded-lg bg-background"
                  >
                    {availableMetrics.map(metric => (
                      <option key={metric} value={metric}>
                        {metric.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>
                </div>

                {chartData.length > 0 ? (
                  <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={(str) => new Date(str).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
                          tick={{ fontSize: 12, fill: '#6b7280' }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis 
                          tick={{ fontSize: 12, fill: '#6b7280' }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(val) => {
                            if (selectedMetric.includes('price') || selectedMetric.includes('Price')) {
                              return `$${(val / 1000).toFixed(0)}k`;
                            }
                            return val.toLocaleString();
                          }}
                        />
                        <Tooltip 
                          wrapperStyle={{ zIndex: 100 }}
                          labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                          formatter={(value: any) => [formatValue(value, selectedMetric), selectedMetric.replace(/_/g, ' ')]}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="value" 
                          stroke="#ef4444" 
                          strokeWidth={2.5} 
                          dot={false}
                          activeDot={{ r: 5 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[400px] w-full flex items-center justify-center border-2 border-dashed rounded-xl bg-muted/10">
                    <p className="text-muted-foreground">No data available for selected metric</p>
                  </div>
                )}

                <div className="mt-6 pt-4 border-t flex items-center gap-2">
                  <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Source:</span>
                  <a 
                    href="https://www.redfin.com/news/data-center/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-muted-foreground/80 hover:text-primary transition-colors underline decoration-dotted underline-offset-2"
                  >
                    Redfin Data Center
                  </a>
                  <span className="text-xs text-muted-foreground/60">•</span>
                  <span className="text-xs text-muted-foreground/60">
                    Data provided by Redfin, a national real estate brokerage
                  </span>
                </div>
              </div>
            )}

            {/* All Available Metrics List */}
            <div className="bg-card text-card-foreground rounded-xl border p-6 shadow-subtle-md">
              <h3 className="text-xl font-bold mb-4">Available Metrics</h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {availableMetrics.map((metric) => {
                  const metricData = redfinData.metrics[metric];
                  const latest = metricData?.[metricData.length - 1];
                  const count = metricData?.length || 0;

                  return (
                    <div key={metric} className="border rounded-lg p-4 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">{metric.replace(/_/g, ' ')}</h4>
                        <Badge variant="outline" className="text-xs">
                          {count} records
                        </Badge>
                      </div>
                      {latest && (
                        <div>
                          <p className="text-2xl font-bold">
                            {formatValue(latest.value, metric)}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Latest: {new Date(latest.date).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
