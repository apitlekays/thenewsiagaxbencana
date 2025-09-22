import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Incidents Dashboard - MAPIM Strategic Centre',
  description: 'Incidents dashboard for MAPIM Strategic Centre digital humanitarian initiatives.',
};

export default function IncidentsDashboardPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">
          Incidents Dashboard
        </h1>
        <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-8 text-center">
          <p className="text-slate-600 dark:text-slate-300">
            Incidents dashboard coming soon...
          </p>
        </div>
      </div>
    </div>
  );
}
