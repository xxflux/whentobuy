'use client';

import React, { useEffect, useState } from 'react';
import { Badge, Spinner, Button } from '@/common/ui';

interface CronStatus {
  status: 'success' | 'unknown' | 'error';
  lastSync: {
    marketMetrics: string | null;
    economicIndicators: string | null;
    news: string | null;
  };
  dataAvailable: {
    marketMetrics: boolean;
    economicIndicators: boolean;
    news: boolean;
  };
  counts: {
    marketMetrics: number;
    economicIndicators: number;
    news: number;
  };
  today: string;
  yesterday: string;
  errors: {
    market: string | undefined;
    economic: string | undefined;
    news: string | undefined;
  };
}

export default function CronStatusPage() {
  const [status, setStatus] = useState<CronStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/cron/status', { 
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      if (!res.ok) {
        throw new Error(`Failed to fetch status: ${res.statusText}`);
      }
      const data = await res.json();
      setStatus(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch cron status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Success</Badge>;
      case 'error':
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">Error</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  if (loading && !status) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 px-4 max-w-5xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Cron Job Status</h1>
            <p className="text-muted-foreground mt-2">
              Monitor the health and sync status of background jobs
            </p>
          </div>
          <Button onClick={fetchStatus} disabled={loading} variant="outlined">
            {loading ? (
              <>
                <Spinner className="h-4 w-4 mr-2" />
                Refreshing...
              </>
            ) : (
              'Refresh'
            )}
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-600 dark:text-red-400 font-medium">Error: {error}</p>
          </div>
        )}

        {status && (
          <>
            {/* Overall Status */}
            <div className="bg-card text-card-foreground rounded-xl border p-6 shadow-subtle-md">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Overall Status</h2>
                {getStatusBadge(status.status)}
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Today:</span>
                  <span className="ml-2 font-medium">{status.today}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Yesterday:</span>
                  <span className="ml-2 font-medium">{status.yesterday}</span>
                </div>
              </div>
            </div>

            {/* Data Availability */}
            <div className="bg-card text-card-foreground rounded-xl border p-6 shadow-subtle-md">
              <h2 className="text-2xl font-bold mb-6">Data Availability</h2>
              <div className="space-y-4">
                {/* Market Metrics */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold">Market Metrics</h3>
                    <Badge variant={status.dataAvailable.marketMetrics ? "default" : "secondary"}>
                      {status.dataAvailable.marketMetrics ? 'Available' : 'Not Available'}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm mt-3">
                    <div>
                      <span className="text-muted-foreground">Last Sync:</span>
                      <span className="ml-2 font-medium">{formatDate(status.lastSync.marketMetrics)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Record Count:</span>
                      <span className="ml-2 font-medium">{status.counts.marketMetrics}</span>
                    </div>
                  </div>
                  {status.errors.market && (
                    <div className="mt-2 text-sm text-red-600 dark:text-red-400">
                      Error: {status.errors.market}
                    </div>
                  )}
                </div>

                {/* Economic Indicators */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold">Economic Indicators</h3>
                    <Badge variant={status.dataAvailable.economicIndicators ? "default" : "secondary"}>
                      {status.dataAvailable.economicIndicators ? 'Available' : 'Not Available'}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm mt-3">
                    <div>
                      <span className="text-muted-foreground">Last Sync:</span>
                      <span className="ml-2 font-medium">{formatDate(status.lastSync.economicIndicators)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Record Count:</span>
                      <span className="ml-2 font-medium">{status.counts.economicIndicators}</span>
                    </div>
                  </div>
                  {status.errors.economic && (
                    <div className="mt-2 text-sm text-red-600 dark:text-red-400">
                      Error: {status.errors.economic}
                    </div>
                  )}
                </div>

                {/* News */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold">Housing News</h3>
                    <Badge variant={status.dataAvailable.news ? "default" : "secondary"}>
                      {status.dataAvailable.news ? 'Available' : 'Not Available'}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm mt-3">
                    <div>
                      <span className="text-muted-foreground">Last Sync:</span>
                      <span className="ml-2 font-medium">{formatDate(status.lastSync.news)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Article Count:</span>
                      <span className="ml-2 font-medium">{status.counts.news}</span>
                    </div>
                  </div>
                  {status.errors.news && (
                    <div className="mt-2 text-sm text-red-600 dark:text-red-400">
                      Error: {status.errors.news}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
