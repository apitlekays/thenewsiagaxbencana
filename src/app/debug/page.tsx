"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

export default function DebugPage() {
  const [diagnostics, setDiagnostics] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const runDiagnostics = async () => {
      const results: any = {};

      // Check environment variables
      results.envVars = {
        supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        supabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        supabaseUrlValue: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 20) + '...',
      };

      // Test Supabase connection
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        try {
          const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
          );

          // Test basic connection
          const { data: authData, error: authError } = await supabase.auth.getSession();
          results.auth = {
            success: !authError,
            error: authError?.message,
            hasSession: !!authData.session
          };

          // Test vessels table access
          const { data: vesselsData, error: vesselsError } = await supabase
            .from('vessels')
            .select('id, name, status')
            .limit(5);

          results.vessels = {
            success: !vesselsError,
            error: vesselsError?.message,
            count: vesselsData?.length || 0,
            sampleData: vesselsData
          };

          // Test vessel_positions table access
          const { data: positionsData, error: positionsError } = await supabase
            .from('vessel_positions')
            .select('id, vessel_id, gsf_vessel_id')
            .limit(5);

          results.positions = {
            success: !positionsError,
            error: positionsError?.message,
            count: positionsData?.length || 0,
            sampleData: positionsData
          };

        } catch (error) {
          results.connection = {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      }

      setDiagnostics(results);
      setLoading(false);
    };

    runDiagnostics();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white p-8">
        <h1 className="text-2xl font-bold mb-4">Running Diagnostics...</h1>
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-8">Supabase Connection Diagnostics</h1>
      
      <div className="space-y-6">
        {/* Environment Variables */}
        <div className="bg-slate-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-emerald-400">Environment Variables</h2>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${diagnostics.envVars?.supabaseUrl ? 'bg-green-500' : 'bg-red-500'}`}></span>
              <span>NEXT_PUBLIC_SUPABASE_URL: {diagnostics.envVars?.supabaseUrl ? '✅ Present' : '❌ Missing'}</span>
              {diagnostics.envVars?.supabaseUrlValue && (
                <span className="text-slate-400">({diagnostics.envVars.supabaseUrlValue})</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${diagnostics.envVars?.supabaseAnonKey ? 'bg-green-500' : 'bg-red-500'}`}></span>
              <span>NEXT_PUBLIC_SUPABASE_ANON_KEY: {diagnostics.envVars?.supabaseAnonKey ? '✅ Present' : '❌ Missing'}</span>
            </div>
          </div>
        </div>

        {/* Supabase Connection */}
        {diagnostics.auth && (
          <div className="bg-slate-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4 text-emerald-400">Supabase Connection</h2>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${diagnostics.auth.success ? 'bg-green-500' : 'bg-red-500'}`}></span>
                <span>Connection: {diagnostics.auth.success ? '✅ Success' : '❌ Failed'}</span>
              </div>
              {diagnostics.auth.error && (
                <div className="text-red-400 text-sm">Error: {diagnostics.auth.error}</div>
              )}
              <div className="text-slate-400 text-sm">
                Session: {diagnostics.auth.hasSession ? 'Active' : 'None (expected for public access)'}
              </div>
            </div>
          </div>
        )}

        {/* Vessels Table */}
        {diagnostics.vessels && (
          <div className="bg-slate-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4 text-emerald-400">Vessels Table Access</h2>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${diagnostics.vessels.success ? 'bg-green-500' : 'bg-red-500'}`}></span>
                <span>Access: {diagnostics.vessels.success ? '✅ Success' : '❌ Failed'}</span>
              </div>
              {diagnostics.vessels.error && (
                <div className="text-red-400 text-sm">Error: {diagnostics.vessels.error}</div>
              )}
              <div className="text-slate-400 text-sm">
                Records found: {diagnostics.vessels.count}
              </div>
              {diagnostics.vessels.sampleData && diagnostics.vessels.sampleData.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-semibold mb-2">Sample Data:</h3>
                  <pre className="bg-slate-900 p-3 rounded text-xs overflow-auto">
                    {JSON.stringify(diagnostics.vessels.sampleData, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Vessel Positions Table */}
        {diagnostics.positions && (
          <div className="bg-slate-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4 text-emerald-400">Vessel Positions Table Access</h2>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${diagnostics.positions.success ? 'bg-green-500' : 'bg-red-500'}`}></span>
                <span>Access: {diagnostics.positions.success ? '✅ Success' : '❌ Failed'}</span>
              </div>
              {diagnostics.positions.error && (
                <div className="text-red-400 text-sm">Error: {diagnostics.positions.error}</div>
              )}
              <div className="text-slate-400 text-sm">
                Records found: {diagnostics.positions.count}
              </div>
              {diagnostics.positions.sampleData && diagnostics.positions.sampleData.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-semibold mb-2">Sample Data:</h3>
                  <pre className="bg-slate-900 p-3 rounded text-xs overflow-auto">
                    {JSON.stringify(diagnostics.positions.sampleData, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Connection Error */}
        {diagnostics.connection && (
          <div className="bg-slate-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4 text-red-400">Connection Error</h2>
            <div className="text-red-400">{diagnostics.connection.error}</div>
          </div>
        )}
      </div>

      <div className="mt-8 p-4 bg-slate-800 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Next Steps:</h3>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>If environment variables are missing, add them to your Vercel project settings</li>
          <li>If connection fails, check your Supabase project URL and anon key</li>
          <li>If table access fails, check RLS policies in Supabase dashboard</li>
          <li>If vessels table is empty, run the edge function to fetch data</li>
        </ul>
      </div>
    </div>
  );
}
