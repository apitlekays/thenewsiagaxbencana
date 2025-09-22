import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login - MAPIM Strategic Centre',
  description: 'Login page for MAPIM Strategic Centre digital humanitarian initiatives.',
};

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
            Login
          </h1>
          <p className="text-slate-600 dark:text-slate-300">
            Access MAPIM Strategic Centre dashboard
          </p>
        </div>
        <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-8 text-center">
          <p className="text-slate-600 dark:text-slate-300">
            Login functionality coming soon...
          </p>
        </div>
      </div>
    </div>
  );
}
