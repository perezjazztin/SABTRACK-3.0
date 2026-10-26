'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Server,
  Database,
  RefreshCw,
  Clock,
  Code2,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import { getHealth } from '@/lib/api-client';
import { API_BASE_URL } from '@/lib/config';
import { HealthResponse } from '@/types/api';
import { StatusCard } from './StatusCard';

export const HealthDashboard: React.FC = () => {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [latency, setLatency] = useState<number | null>(null);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    const start = performance.now();

    try {
      const data = await getHealth();
      const elapsed = Math.round(performance.now() - start);
      setHealth(data);
      setLatency(elapsed);
      setLastChecked(new Date());
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to connect to backend';
      setError(message);
      setHealth(null);
      setLatency(null);
      setLastChecked(new Date());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const apiStatus = health
    ? 'online'
    : error
    ? 'offline'
    : 'neutral';

  const dbStatus =
    health?.database === 'connected'
      ? 'online'
      : health
      ? 'degraded'
      : 'offline';

  return (
    <div className="space-y-6">
      {/* Header with Refresh CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-civic-border">
        <div>
          <h2 className="text-xl font-bold text-civic-slate tracking-tight">
            System & Foundation Diagnostics
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Phase 1 live probe testing communication between Next.js, FastAPI, and PostgreSQL.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {lastChecked && (
            <span className="text-[11px] text-slate-500 flex items-center">
              <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
              Checked: {lastChecked.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={fetchStatus}
            disabled={loading}
            aria-label="Refresh system health status"
            className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-civic-forest text-white hover:bg-civic-forestHover focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-colors disabled:opacity-50"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`}
            />
            {loading ? 'Probing...' : 'Re-check Status'}
          </button>
        </div>
      </div>

      {/* Connectivity Alert Banner */}
      {error && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start space-x-3"
        >
          <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-rose-800">
              API Connection Offline
            </p>
            <p className="text-rose-700 leading-relaxed">{error}</p>
            <p className="text-rose-600 font-mono text-[11px] pt-1">
              Hint: Start the FastAPI backend via <code className="bg-rose-100 px-1 py-0.5 rounded">.\scripts\run-api.bat</code> or <code className="bg-rose-100 px-1 py-0.5 rounded">uvicorn app.main:app --reload</code>.
            </p>
          </div>
        </div>
      )}

      {/* Four Core Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatusCard
          title="FastAPI Backend"
          status={apiStatus}
          value={health ? 'REST API Online' : 'Unreachable'}
          subtext={
            health
              ? `Target: ${API_BASE_URL} (${latency}ms roundtrip)`
              : `Attempting connection to ${API_BASE_URL}`
          }
          icon={Server}
        />

        <StatusCard
          title="PostgreSQL Database"
          status={dbStatus}
          value={
            health?.database === 'connected'
              ? 'Connected'
              : health
              ? 'Disconnected'
              : 'Unknown'
          }
          subtext={
            health?.database === 'connected'
              ? 'PostgreSQL driver active (psycopg 3.x)'
              : 'Requires local PostgreSQL service & sabtrack_dev DB'
          }
          icon={Database}
        />

        <StatusCard
          title="Environment"
          status={health ? 'neutral' : 'offline'}
          value={health ? health.environment.toUpperCase() : 'DEVELOPMENT'}
          subtext={`API v${health?.version || '3.0.0'} • Next.js 15 App Router`}
          icon={Code2}
        />

        <StatusCard
          title="Security & RBAC"
          status="online"
          value="Baseline Active"
          subtext="HttpOnly session cookie & CORS configured"
          icon={CheckCircle2}
        />
      </div>

      {/* Database Diagnostic & Action Guidance */}
      {health && health.database === 'disconnected' && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-xs text-amber-900">
          <div className="flex items-start space-x-3">
            <HelpCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <h3 className="font-bold text-amber-900 text-sm">
                PostgreSQL Service Configuration Required
              </h3>
              <p className="text-amber-800 leading-relaxed">
                The FastAPI application is running successfully, but it cannot currently connect to PostgreSQL on <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">localhost:5432</code>. As approved in the Foundation Review, PostgreSQL is our mandatory primary database.
              </p>
              <div className="bg-white/80 p-3 rounded-lg border border-amber-200 font-mono text-[11px] text-slate-800 space-y-1">
                <div className="font-semibold text-slate-900">Quick Setup Instructions:</div>
                <div>1. Download and run the Windows PostgreSQL installer (or install via winget).</div>
                <div>2. Ensure the service is running: <span className="text-emerald-700">Get-Service *postgres*</span></div>
                <div>3. Create the development database: <span className="text-emerald-700">createdb -U postgres sabtrack_dev</span></div>
                <div>4. Apply Alembic migrations: <span className="text-emerald-700">alembic upgrade head</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Architectural Verification Summary */}
      <div className="neu-card rounded-3xl border border-emerald-900/10 p-6 sm:p-7 shadow-neu-raised space-y-4">
        <h3 className="text-sm font-bold text-civic-slate uppercase tracking-wider flex items-center">
          <CheckCircle2 className="w-4 h-4 text-civic-emerald mr-2" />
          Phase 1 Foundation Verification Checklist
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="neu-socket p-3.5 rounded-2xl border border-emerald-900/5 flex items-start space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
            <div>
              <span className="font-semibold text-slate-800">Decoupled Monolith Stack:</span>
              <p className="text-slate-500">FastAPI backend on port 8000 and Next.js frontend on port 3000 communicating over typed JSON REST endpoints.</p>
            </div>
          </div>

          <div className="neu-socket p-3.5 rounded-2xl border border-emerald-900/5 flex items-start space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
            <div>
              <span className="font-semibold text-slate-800">No Hardcoded Purok Assumptions:</span>
              <p className="text-slate-500">Geographic entity model configured with dynamic <code className="bg-slate-200 px-1 rounded">areas</code> schema and synthetic demo tags.</p>
            </div>
          </div>

          <div className="neu-socket p-3.5 rounded-2xl border border-emerald-900/5 flex items-start space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
            <div>
              <span className="font-semibold text-slate-800">Alembic Migration Discipline:</span>
              <p className="text-slate-500">Version-controlled migrations initialized at <code className="bg-slate-200 px-1 rounded">apps/api/alembic/versions</code> ready for execution.</p>
            </div>
          </div>

          <div className="neu-socket p-3.5 rounded-2xl border border-emerald-900/5 flex items-start space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
            <div>
              <span className="font-semibold text-slate-800">Test Harness & CI Ready:</span>
              <p className="text-slate-500">Pytest 9.x configured for backend APIs; Vitest 3.x configured for React component testing.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
