import LoadingSpinner from '@/components/LoadingSpinner';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Loading - MAPIM Strategic Centre",
  description: "Loading MAPIM Strategic Centre Digital Initiatives...",
  robots: "noindex, nofollow",
};

export default function Loading() {
  return <LoadingSpinner fullScreen={true} />;
} 