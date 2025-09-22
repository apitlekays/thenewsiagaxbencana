import { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Dashboard - MAPIM Strategic Centre',
  description: 'Dashboard for MAPIM Strategic Centre digital humanitarian initiatives.',
};

export default function DashboardPage() {
  // Redirect to incidents for now
  redirect('/dashboard/incidents');
}
