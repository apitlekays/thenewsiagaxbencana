"use client";

import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { ArrowLeft, Ship, Clock, Navigation, Route, Play, Pause, SkipBack, SkipForward, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useVessels } from '@/hooks/queries/useVessels';
import { createClient } from '@supabase/supabase-js';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in React-Leaflet
delete (L.Icon.Default.prototype as unknown as { _getIconUrl: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Color scheme for vessel origins
const ORIGIN_COLORS: Record<string, string> = {
  'barcelona': '#3b82f6',    // Blue
  'sicily': '#8b5cf6',       // Purple
  'tunis': '#10b981',        // Green
  'greece': '#f59e0b',       // Orange
  'libya': '#ef4444',        // Red
  'malta': '#06b6d4',        // Cyan
  'unknown': '#6b7280',      // Gray for null/unknown origins
};

// Function to get color for origin
function getOriginColor(origin: string | null): string {
  if (!origin) return ORIGIN_COLORS['unknown'];
  const normalizedOrigin = origin.toLowerCase();
  return ORIGIN_COLORS[normalizedOrigin] || ORIGIN_COLORS['unknown'];
}

// Function to create vessel icon with origin-based color
function createVesselIcon(origin: string | null, size: number = 25): L.Icon {
  const color = getOriginColor(origin);
  
  return new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 2}" fill="${color}" stroke="#ffffff" stroke-width="2"/>
        <svg x="${size * 0.1}" y="${size * 0.1}" width="${size * 0.8}" height="${size * 0.8}" viewBox="0 0 706 592" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 0 C1.111 0.273 1.111 0.273 2.244 0.551 C8.096 2.001 13.923 3.546 19.742 5.121 C24.882 6.511 30.035 7.847 35.188 9.188 C42.273 11.033 49.357 12.883 56.438 14.75 C66.286 17.346 76.142 19.916 85.998 22.484 C90.811 23.738 95.624 24.994 100.438 26.25 C102.354 26.75 104.271 27.25 106.188 27.75 C110.021 28.75 113.854 29.75 117.688 30.75 C118.637 30.998 119.586 31.245 120.563 31.5 C122.477 31.999 124.39 32.499 126.304 32.998 C131.145 34.261 135.986 35.523 140.828 36.785 C145.639 38.039 150.45 39.295 155.261 40.552 C157.749 41.201 160.238 41.847 162.727 42.492 C166.581 43.493 170.43 44.516 174.277 45.546 C176.224 46.061 178.174 46.567 180.125 47.067 C183.547 47.944 186.961 48.846 190.375 49.75 C191.46 50.023 192.545 50.295 193.664 50.576 C197.928 51.724 201.208 52.685 204.723 55.406 C207.4 61.673 205.002 67.432 202.707 73.461 C201.732 75.854 200.746 78.241 199.75 80.625 C199.209 81.943 198.67 83.263 198.132 84.582 C196.991 87.377 195.846 90.169 194.696 92.96 C192.084 99.316 189.538 105.699 186.991 112.082 C186.117 114.269 185.242 116.456 184.367 118.643 C179.663 130.399 175.011 142.174 170.37 153.955 C165.465 166.405 160.52 178.838 155.529 191.253 C154.838 192.974 154.838 192.974 154.133 194.73 C153.731 195.73 153.329 196.729 152.915 197.759 C152.204 199.57 151.553 201.404 150.938 203.25 C151.595 203.204 152.252 203.157 152.93 203.109 C168.576 202.516 182.222 207.21 195.938 214.25 C205.989 219.269 215.612 222.084 226.875 222.75 C233.062 223.138 236.884 224.085 241.25 228.688 C244.173 233.126 244.395 236.947 243.938 242.25 C241.143 247.528 237.672 251.339 231.938 253.25 C213.499 254.725 197.466 249.31 181.115 241.482 C165.175 233.882 145.222 230.269 127.938 236.25 C122.823 238.334 117.802 240.613 112.805 242.961 C111.992 243.342 111.179 243.724 110.342 244.117 C108.772 244.857 107.205 245.601 105.64 246.352 C86.614 255.22 62.947 256.003 42.938 250.25 C41.331 249.832 41.331 249.832 39.691 249.406 C33.789 247.762 28.504 245.631 23.062 242.812 C11.224 236.758 1.524 233.82 -11.75 233.75 C-12.783 233.744 -13.816 233.737 -14.88 233.731 C-26.43 233.921 -36.059 236.851 -46.25 242.125 C-52.813 245.381 -59.268 248.268 -66.312 250.312 C-66.966 250.504 -67.62 250.695 -68.294 250.892 C-93.71 257.788 -118.718 252.07 -141.734 240.809 C-157.443 233.146 -177.146 230.812 -194.062 236.25 C-200.123 238.651 -205.993 241.523 -211.858 244.364 C-225.816 251.067 -241.521 254.848 -257.062 253.25 C-262.112 250.899 -265.562 247.251 -268.062 242.25 C-268.626 237.631 -268.505 234.152 -266.438 229.938 C-262.972 226.016 -260.534 223.523 -255.125 222.926 C-252.738 222.804 -250.352 222.684 -247.965 222.566 C-235.145 221.527 -224.267 216.798 -212.885 211.147 C-202.734 206.152 -192.186 203.154 -180.82 203.218 C-179.741 203.222 -178.662 203.227 -177.551 203.232 C-176.73 203.238 -175.909 203.244 -175.062 203.25 C-175.285 202.689 -175.507 202.127 -175.737 201.549 C-178.09 195.61 -180.443 189.67 -182.796 183.731 C-183.669 181.526 -184.543 179.321 -185.417 177.116 C-189.598 166.565 -193.777 156.015 -197.871 145.43 C-200.124 139.606 -202.462 133.827 -204.887 128.072 C-207.519 121.754 -209.97 115.362 -212.458 108.986 C-212.947 107.734 -213.436 106.482 -213.926 105.23 C-214.298 104.278 -214.298 104.278 -214.678 103.307 C-216.345 99.052 -218.04 94.81 -219.751 90.573 C-220.961 87.575 -222.164 84.574 -223.366 81.573 C-223.952 80.116 -224.541 78.661 -225.135 77.208 C-225.968 75.166 -226.788 73.119 -227.605 71.07 C-228.317 69.311 -228.317 69.311 -229.044 67.516 C-230.084 64.181 -230.382 61.717 -230.062 58.25 C-228.09 54.839 -226.735 53.516 -223.059 52.062 C-221.884 51.794 -220.71 51.526 -219.5 51.25 C-218.146 50.925 -216.792 50.6 -215.438 50.273 C-214.723 50.108 -214.009 49.943 -213.273 49.772 C-209.496 48.88 -205.751 47.871 -202 46.875 C-201.2 46.665 -200.401 46.456 -199.577 46.24 C-195.406 45.145 -191.242 44.03 -187.086 42.879 C-174.652 39.437 -162.167 36.233 -149.642 33.141 C-140.753 30.945 -131.904 28.629 -123.062 26.25 C-120.064 25.454 -117.063 24.664 -114.062 23.875 C-113.28 23.669 -112.498 23.464 -111.692 23.252 C-102.466 20.827 -93.234 18.422 -84.002 16.016 C-79.189 14.762 -74.376 13.506 -69.562 12.25 C-63.766 10.738 -57.969 9.226 -52.172 7.715 C-51.201 7.462 -50.231 7.209 -49.231 6.948 C-47.301 6.445 -45.37 5.943 -43.439 5.443 C-38.842 4.249 -34.253 3.033 -29.676 1.762 C-28.823 1.528 -27.97 1.294 -27.091 1.053 C-25.508 0.618 -23.928 0.175 -22.351 -0.278 C-14.562 -2.404 -7.785 -1.991 0 0 Z" fill="white" transform="translate(367.0625,261.75)"/>
          <path d="M0 0 C1.027 -0.004 2.053 -0.008 3.111 -0.012 C4.823 -0.01 4.823 -0.01 6.57 -0.009 C8.373 -0.013 8.373 -0.013 10.212 -0.018 C13.564 -0.025 16.915 -0.028 20.267 -0.029 C23.876 -0.03 27.484 -0.038 31.093 -0.045 C38.992 -0.058 46.891 -0.064 54.79 -0.069 C59.719 -0.072 64.648 -0.076 69.578 -0.08 C83.217 -0.092 96.857 -0.103 110.497 -0.106 C111.807 -0.106 111.807 -0.106 113.144 -0.107 C114.02 -0.107 114.896 -0.107 115.798 -0.107 C117.573 -0.108 119.347 -0.108 121.122 -0.109 C122.003 -0.109 122.883 -0.109 123.79 -0.109 C138.055 -0.113 152.32 -0.131 166.585 -0.154 C181.22 -0.178 195.854 -0.19 210.489 -0.192 C218.711 -0.192 226.932 -0.198 235.153 -0.216 C242.154 -0.232 249.155 -0.237 256.156 -0.229 C259.729 -0.225 263.302 -0.226 266.875 -0.24 C270.747 -0.255 274.618 -0.247 278.49 -0.236 C279.622 -0.244 280.755 -0.252 281.922 -0.26 C283.477 -0.251 283.477 -0.251 285.064 -0.241 C285.958 -0.241 286.852 -0.242 287.772 -0.242 C290.887 0.221 292.744 1.293 295.284 3.131 C297.337 6.211 297.533 6.819 297.524 10.289 C297.528 11.557 297.528 11.557 297.533 12.851 C297.525 13.775 297.518 14.699 297.511 15.652 C297.511 16.627 297.511 17.603 297.512 18.609 C297.51 21.839 297.495 25.069 297.479 28.299 C297.475 30.537 297.473 32.775 297.471 35.013 C297.463 40.906 297.443 46.8 297.421 52.694 C297.401 58.706 297.392 64.719 297.381 70.731 C297.36 82.531 297.326 94.331 297.284 106.131 C295.396 105.828 293.508 105.521 291.621 105.212 C290.57 105.042 289.519 104.871 288.436 104.696 C283.708 103.849 279.104 102.638 274.471 101.381 C272.454 100.845 270.437 100.308 268.421 99.772 C267.403 99.499 266.385 99.227 265.336 98.946 C260.491 97.653 255.637 96.393 250.784 95.131 C248.872 94.633 246.961 94.134 245.049 93.635 C241.164 92.622 237.279 91.609 233.393 90.596 C223.752 88.083 214.112 85.563 204.477 83.024 C195.425 80.639 186.366 78.28 177.307 75.92 C174.154 75.098 171.002 74.275 167.85 73.452 C166.803 73.178 165.756 72.905 164.677 72.623 C162.666 72.098 160.655 71.573 158.644 71.048 C157.738 70.811 156.831 70.574 155.897 70.331 C155.101 70.123 154.305 69.915 153.484 69.701 C152.758 69.513 152.032 69.325 151.284 69.131 C150.694 68.942 150.103 68.752 149.495 68.556 C143.426 67.39 137.947 68.218 132.03 69.741 C131.367 69.909 130.703 70.077 130.02 70.25 C127.918 70.785 125.82 71.333 123.721 71.881 C122.343 72.234 120.965 72.585 119.587 72.936 C111.619 74.971 103.673 77.086 95.729 79.212 C90.919 80.496 86.102 81.753 81.284 83.006 C79.294 83.525 77.305 84.043 75.315 84.561 C73.817 84.951 73.817 84.951 72.288 85.349 C67.453 86.608 62.618 87.87 57.784 89.131 C55.867 89.631 53.95 90.131 52.034 90.631 C51.085 90.879 50.136 91.126 49.159 91.381 C40.534 93.631 40.534 93.631 37.655 94.382 C35.752 94.879 33.849 95.376 31.946 95.873 C26.944 97.179 21.941 98.479 16.936 99.772 C15.896 100.041 14.856 100.311 13.784 100.588 C11.796 101.103 9.808 101.616 7.819 102.128 C4.138 103.082 0.534 104.044 -3.056 105.303 C-5.784 106.153 -7.883 106.194 -10.716 106.131 C-10.832 93.179 -10.921 80.228 -10.975 67.275 C-11.001 61.261 -11.037 55.247 -11.093 49.233 C-11.148 43.43 -11.178 37.627 -11.191 31.824 C-11.2 29.609 -11.218 27.394 -11.245 25.18 C-11.281 22.079 -11.286 18.98 -11.284 15.879 C-11.302 14.962 -11.32 14.045 -11.338 13.1 C-11.301 8.535 -11.214 6.745 -8.243 3.085 C-7.409 2.44 -6.575 1.796 -5.716 1.131 C-4.084 -0.501 -2.253 0.003 0 0 Z" fill="white" transform="translate(211.71620559692383,161.86857223510742)"/>
          <path d="M0 0 C1.355 0.353 2.711 0.705 4.066 1.055 C7.426 1.926 10.779 2.817 14.131 3.716 C16.128 4.251 18.126 4.782 20.124 5.312 C26.305 6.952 32.479 8.616 38.64 10.329 C50.225 13.54 61.874 16.478 73.545 19.358 C86.004 22.437 98.426 25.661 110.75 29.25 C111.594 29.485 112.439 29.719 113.309 29.961 C119.112 31.661 123.061 33.688 126.938 38.5 C129.075 43.45 128.734 47.582 126.938 52.5 C124.586 56.068 121.941 58.342 118.125 60.25 C109.358 61.161 101.751 59.363 93.392 56.9 C88.993 55.638 84.556 54.519 80.125 53.375 C78.141 52.858 76.156 52.342 74.172 51.824 C73.173 51.564 72.175 51.304 71.146 51.037 C63.369 49.012 55.591 46.984 47.815 44.953 C46.086 44.501 44.356 44.049 42.626 43.598 C34.467 41.468 26.316 39.31 18.187 37.069 C14.486 36.051 10.781 35.046 7.075 34.047 C5.035 33.496 2.995 32.941 0.956 32.383 C-2.254 31.509 -5.47 30.659 -8.688 29.812 C-9.671 29.541 -10.655 29.27 -11.669 28.99 C-20.686 26.661 -27.593 27.641 -36.438 30.312 C-46.585 33.255 -56.834 35.775 -67.09 38.307 C-74.885 40.234 -82.653 42.235 -90.407 44.319 C-95.224 45.612 -100.049 46.87 -104.875 48.125 C-105.836 48.375 -106.796 48.626 -107.786 48.884 C-112.894 50.216 -118.003 51.542 -123.113 52.863 C-124.131 53.127 -125.149 53.391 -126.197 53.663 C-128.127 54.163 -130.056 54.661 -131.986 55.158 C-136.403 56.304 -140.77 57.52 -145.121 58.895 C-151.369 60.788 -158.754 62.083 -164.93 59.336 C-168.875 56.293 -171.395 52.206 -172.191 47.301 C-172.494 42.173 -171.233 39.261 -167.875 35.25 C-165.127 32.919 -162.771 31.705 -159.309 30.742 C-158.428 30.494 -157.547 30.247 -156.64 29.991 C-155.728 29.747 -154.815 29.502 -153.875 29.25 C-152.997 29.013 -152.12 28.776 -151.215 28.532 C-148.459 27.8 -145.699 27.085 -142.938 26.375 C-140.897 25.847 -138.857 25.318 -136.816 24.789 C-135.811 24.529 -134.806 24.269 -133.77 24.001 C-129.635 22.928 -125.505 21.84 -121.375 20.75 C-111.526 18.154 -101.671 15.584 -91.814 13.016 C-88.913 12.26 -86.011 11.503 -83.109 10.746 C-81.689 10.375 -81.689 10.375 -80.239 9.997 C-78.333 9.5 -76.427 9.002 -74.521 8.505 C-69.618 7.225 -64.714 5.949 -59.809 4.68 C-58.813 4.421 -57.817 4.163 -56.791 3.897 C-54.824 3.387 -52.857 2.879 -50.889 2.373 C-46.825 1.319 -42.781 0.251 -38.777 -1.016 C-37.613 -1.382 -36.449 -1.748 -35.25 -2.125 C-33.838 -2.601 -33.838 -2.601 -32.398 -3.086 C-21.123 -5.211 -10.845 -2.924 0 0 Z" fill="white" transform="translate(376.875,304.75)"/>
          <path d="M0 0 C0.987 -0.003 1.974 -0.006 2.991 -0.009 C5.065 -0.011 7.139 -0.005 9.213 0.007 C12.366 0.023 15.518 0.007 18.672 -0.012 C20.698 -0.01 22.724 -0.006 24.75 0 C25.682 -0.006 26.613 -0.012 27.573 -0.018 C35.787 0.069 43.107 1.491 49.25 7.273 C50.329 8.26 50.329 8.26 51.43 9.266 C64.477 23.571 57.375 50.2 57.375 65.398 C27.675 65.398 -2.025 65.398 -32.625 65.398 C-32.625 15.82 -32.625 15.82 -25.125 7.793 C-17.843 0.966 -9.66 -0.063 0 0 Z" fill="white" transform="translate(342.625,66.6015625)"/>
        </svg>
    </svg>
  `),
    iconSize: [size, size],
    iconAnchor: [size/2, size/2],
    popupAnchor: [0, -size/2],
  });
}

// Component to get map reference for animation
function MapRef({ mapRef }: { mapRef: React.MutableRefObject<L.Map | null> }) {
  const map = useMap();
  
  useEffect(() => {
    mapRef.current = map;
  }, [map, mapRef]);
  
  return null;
}

// Component to handle map recentering based on vessel positions
function MapRecenter({ vessels }: { vessels: Array<{ latitude?: number | null; longitude?: number | null }> }) {
  const map = useMap();
  const [hasRecentered, setHasRecentered] = useState(false);

  useEffect(() => {
    // Only recenter once when vessels are loaded and we haven't recentered yet
    if (vessels.length > 0 && !hasRecentered) {
      const validVessels = vessels.filter(vessel => 
        vessel.latitude && vessel.longitude && 
        !isNaN(parseFloat(vessel.latitude.toString())) && 
        !isNaN(parseFloat(vessel.longitude.toString()))
      );

      if (validVessels.length > 0) {
        // Calculate bounds of all vessel positions
        const positions = validVessels.map(vessel => [
          parseFloat(vessel.latitude!.toString()),
          parseFloat(vessel.longitude!.toString())
        ] as [number, number]);

        // Create bounds from all positions
        const bounds = L.latLngBounds(positions);
        
        // Add some padding to the bounds
        const paddedBounds = bounds.pad(0.1); // 10% padding
        
        // Fit the map to show all vessels with padding
        map.fitBounds(paddedBounds, {
          padding: [20, 20], // Additional padding in pixels
          maxZoom: 8 // Don't zoom in too close
        });

        console.log(`🗺️ Map recentered to show ${validVessels.length} vessels`);
        setHasRecentered(true);
      }
    }
  }, [vessels, map, hasRecentered]);

  return null; // This component doesn't render anything
}

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Custom hook to fetch all vessel positions grouped by vessel
function useAllVesselPositions() {
  const [vesselPositions, setVesselPositions] = useState<Record<string, Array<{
    id: number;
    vessel_id: number;
    gsf_vessel_id: number;
    latitude: number;
    longitude: number;
    speed_kmh: number | null;
    speed_knots: number | null;
    course: number | null;
    timestamp_utc: string;
    created_at: string;
  }>>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAllVesselPositions() {
      try {
        setLoading(true);
        setError(null);

        console.log('🔄 Fetching all vessel positions...');

        // Fetch ALL positions for all vessels (bypass Supabase's default 1000 limit)
        const { data: allPositions, error: positionsError } = await supabase
          .from('vessel_positions')
          .select('*')
          .order('timestamp_utc', { ascending: true })
          .limit(100000); // High limit to get all positions

        if (positionsError) {
          throw new Error(`Failed to fetch positions: ${positionsError.message || 'Unknown error'}`);
        }

        // Fetch all vessels to get the mapping
        const { data: allVessels, error: vesselsError } = await supabase
          .from('vessels')
          .select('id, gsf_id, name')
          .eq('status', 'active');

        if (vesselsError) {
          throw new Error(`Failed to fetch vessels: ${vesselsError.message || 'Unknown error'}`);
        }

        // Create a mapping from gsf_id to vessel name
        const vesselMapping: Record<number, string> = {};
        allVessels?.forEach(vessel => {
          vesselMapping[vessel.gsf_id] = vessel.name;
        });

        // Group positions by vessel name
        const groupedPositions: Record<string, Array<{
          id: number;
          vessel_id: number;
          gsf_vessel_id: number;
          latitude: number;
          longitude: number;
          speed_kmh: number | null;
          speed_knots: number | null;
          course: number | null;
          timestamp_utc: string;
          created_at: string;
        }>> = {};
        
        allPositions?.forEach(position => {
          const vesselName = vesselMapping[position.gsf_vessel_id];
          if (vesselName) {
            if (!groupedPositions[vesselName]) {
              groupedPositions[vesselName] = [];
            }
            groupedPositions[vesselName].push(position);
          }
        });

        console.log(`📍 Fetched ${allPositions?.length || 0} total positions for ${Object.keys(groupedPositions).length} vessels`);
        console.log(`🔍 Vessel mapping created for ${Object.keys(vesselMapping).length} vessels`);
        console.log('📊 Positions per vessel:', Object.entries(groupedPositions).map(([name, positions]) => `${name}: ${positions.length}`));
        console.log('🔍 Vessel mapping sample:', Object.entries(vesselMapping).slice(0, 5));
        
        setVesselPositions(groupedPositions);
      } catch (err) {
        console.error('Error fetching all vessel positions:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchAllVesselPositions();
  }, []);

  return { vesselPositions, loading, error };
}


export default function VesselTrackerMap() {
  const { vessels, loading: vesselsLoading, error: vesselsError } = useVessels();
  const { vesselPositions, loading: positionsLoading, error: positionsError } = useAllVesselPositions();
  const [latestDataTimestamp, setLatestDataTimestamp] = useState<string | null>(null);

  // Timeline playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [timelineData, setTimelineData] = useState<Array<{timestamp: string, vessels: Array<{name: string, lat: number, lng: number, origin: string | null}>}>>([]);
  const [timelineRange, setTimelineRange] = useState<{start: string, end: string} | null>(null);
  const [animatedVessels, setAnimatedVessels] = useState<Array<{name: string, lat: number, lng: number, origin: string | null}>>([]);
  const animationRef = useRef<number | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  const loading = vesselsLoading || positionsLoading;
  const error = vesselsError || (positionsError ? new Error(positionsError) : null);

  // Fetch latest timestamp from cron job (development only)
  useEffect(() => {
    async function fetchLatestTimestamp() {
      try {
        const response = await fetch('/api/cron/fetch-vessel-data?timestamp=true');
        if (response.ok) {
          const data = await response.json();
          if (data.latestTimestamp) {
            setLatestDataTimestamp(data.latestTimestamp);
          }
        }
      } catch (error) {
        console.error('Failed to fetch latest timestamp:', error);
      }
    }

    // Only fetch in development
    if (process.env.NODE_ENV === 'development') {
      fetchLatestTimestamp();
    }
  }, []);

  // Process timeline data for playback
  useEffect(() => {
    if (Object.keys(vesselPositions).length === 0) return;

    const allTimestamps = new Set<string>();
    const vesselData: Record<string, Array<{timestamp: string, lat: number, lng: number}>> = {};

    // Collect all timestamps and vessel positions
    Object.entries(vesselPositions).forEach(([vesselName, positions]) => {
      vesselData[vesselName] = positions.map(pos => ({
        timestamp: pos.timestamp_utc,
        lat: pos.latitude,
        lng: pos.longitude
      }));
      positions.forEach(pos => allTimestamps.add(pos.timestamp_utc));
    });

    // Sort timestamps
    const sortedTimestamps = Array.from(allTimestamps).sort();

    // Limit timeline data to prevent freezing (sample every 10th timestamp for large datasets)
    const sampleRate = sortedTimestamps.length > 1000 ? 10 : 1;
    const sampledTimestamps = sortedTimestamps.filter((_, index) => index % sampleRate === 0);

    console.log(`📊 Processing ${sampledTimestamps.length} timestamps (sampled from ${sortedTimestamps.length})`);

    // Create timeline data
    const timeline = sampledTimestamps.map(timestamp => {
      const vesselsAtTime: Array<{name: string, lat: number, lng: number, origin: string | null}> = [];
      
      Object.entries(vesselData).forEach(([vesselName, positions]) => {
        const vessel = vessels.find(v => v.name === vesselName);
        const positionAtTime = positions.find(pos => pos.timestamp === timestamp);
        
        if (positionAtTime && vessel) {
          vesselsAtTime.push({
            name: vesselName,
            lat: positionAtTime.lat,
            lng: positionAtTime.lng,
            origin: vessel.origin || null
          });
        }
      });

      return {
        timestamp,
        vessels: vesselsAtTime
      };
    });

      setTimelineData(timeline);
    if (timeline.length > 0) {
      setTimelineRange({
        start: timeline[0].timestamp,
        end: timeline[timeline.length - 1].timestamp
      });
      // Set initial position to the end (current timestamp)
      setCurrentTime(timeline.length - 1);
      // Set initial animated vessels to current positions
      setAnimatedVessels(timeline[timeline.length - 1].vessels);
    }
  }, [vesselPositions, vessels]);

  // Animation functions
  const animateVessels = useCallback((timeIndex: number) => {
    if (timeIndex >= timelineData.length) return;

    const currentFrame = timelineData[timeIndex];
    if (!currentFrame) return;

    // Update animated vessel positions
    setAnimatedVessels(currentFrame.vessels);
  }, [timelineData]);

  const startAnimation = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    const animate = () => {
      setCurrentTime(prev => {
        const nextTime = prev + playbackSpeed;
        if (nextTime >= timelineData.length - 1) {
          setIsPlaying(false);
          return timelineData.length - 1;
        }
        return nextTime;
      });
      
      if (isPlaying) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    if (isPlaying) {
      animationRef.current = requestAnimationFrame(animate);
    }
  }, [isPlaying, playbackSpeed, timelineData.length]);

  useEffect(() => {
    if (isPlaying) {
      startAnimation();
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }
  }, [isPlaying, startAnimation]);

  useEffect(() => {
    animateVessels(Math.floor(currentTime));
  }, [currentTime, animateVessels]);

  // Playback controls
  const togglePlayPause = () => {
    if (!isPlaying) {
      // When starting playback, reset to beginning
      setCurrentTime(0);
      if (timelineData.length > 0) {
        setAnimatedVessels(timelineData[0].vessels);
      }
    }
    setIsPlaying(!isPlaying);
  };
  const resetTimeline = () => {
    setIsPlaying(false);
    setCurrentTime(timelineData.length - 1);
    if (timelineData.length > 0) {
      setAnimatedVessels(timelineData[timelineData.length - 1].vessels);
    }
  };
  const skipToStart = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (timelineData.length > 0) {
      setAnimatedVessels(timelineData[0].vessels);
    }
  };
  const skipToEnd = () => {
    setIsPlaying(false);
    setCurrentTime(timelineData.length - 1);
    if (timelineData.length > 0) {
      setAnimatedVessels(timelineData[timelineData.length - 1].vessels);
    }
  };

  // Process all vessel positions into pathway coordinates
  const vesselPathways = Object.entries(vesselPositions).reduce((acc, [vesselName, positions]) => {
    const validPositions = positions.filter(position => {
      const lat = parseFloat(position.latitude.toString());
      const lng = parseFloat(position.longitude.toString());
      return !isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
    });

    acc[vesselName] = validPositions.map(position => [
      parseFloat(position.latitude.toString()),
      parseFloat(position.longitude.toString())
    ] as [number, number]);

    return acc;
  }, {} as Record<string, [number, number][]>);

  // Debug logging for all vessels
  console.log('🔍 All Vessels Debug:', {
    totalVessels: Object.keys(vesselPositions).length,
    vesselPathways: Object.entries(vesselPathways).map(([name, pathway]) => ({
      name,
      positions: vesselPositions[name]?.length || 0,
      pathwayLength: pathway.length
    })),
    loading: positionsLoading,
    error: positionsError
  });


  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-lg">Loading vessel data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="text-center">
          <p className="text-lg text-red-400">Error loading vessel data: {error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen relative">
      {/* Back Button */}
      <Link 
        href="/" 
        className="absolute top-4 left-4 z-[1000] bg-white/90 hover:bg-white dark:bg-slate-800/90 dark:hover:bg-slate-800 rounded-lg p-3 shadow-lg border border-slate-200 dark:border-slate-700 transition-colors"
      >
        <ArrowLeft className="w-5 h-5 text-slate-700 dark:text-slate-300" />
      </Link>

      {/* Latest Data Timestamp (Development Only) */}
      {process.env.NODE_ENV === 'development' && latestDataTimestamp && (
      <div className="absolute top-4 right-4 z-[1000] bg-white/90 dark:bg-slate-800/90 rounded-lg p-3 shadow-lg border border-slate-200 dark:border-slate-700">
          <div className="text-xs text-slate-600 dark:text-slate-400">
            <div className="font-medium mb-1">Latest Data:</div>
            <div className="font-mono text-xs">
              {new Date(latestDataTimestamp).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                timeZone: 'UTC'
              })} {new Date(latestDataTimestamp).toLocaleTimeString('en-GB', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
                timeZone: 'UTC'
              })} UTC
        </div>
          </div>
          </div>
        )}

      {/* Maintenance Alert */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000] bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 shadow-lg max-w-md">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              System Under Maintenance
            </h3>
            <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
              Vessel tracking data is being updated. Some features may be temporarily unavailable.
            </p>
          </div>
        </div>
      </div>
      
      <MapContainer
        center={[35.0, 20.0]} // Center of Mediterranean Sea
        zoom={6}
        minZoom={5}
        maxZoom={12}
        style={{ height: '100vh', width: '100%' }}
        className="z-0"
        zoomControl={false}
        attributionControl={false}
        maxBounds={[
          [25.0, -10.0], // Southwest corner (Libya)
          [50.0, 50.0]  // Northeast corner (Ukraine)
        ]}
        boundsOptions={{
          padding: [20, 20]
        }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
          subdomains="abc"
          maxZoom={20}
        />
        
        {/* Map Recenter Component */}
        <MapRecenter vessels={vessels} />
        
        {/* Map Reference for Animation */}
        <MapRef mapRef={mapRef} />
        
        {/* All Vessel Pathways */}
        {Object.entries(vesselPathways).map(([vesselName, pathway]) => {
          if (pathway.length === 0) return null;
          
          console.log(`🎨 Rendering pathway for ${vesselName} with ${pathway.length} points`);
          
          // Find the vessel to get its origin
          const vessel = vessels.find(v => v.name === vesselName);
          const origin = vessel?.origin || null;
          const color = getOriginColor(origin);
          
          return (
            <Polyline
              key={vesselName}
              positions={pathway}
              color={color}
              weight={3}
              opacity={0.8}
              dashArray="5, 5"
            />
          );
        })}
        
        {/* Vessel Markers - Show animated vessels if available, otherwise show static vessels */}
        {(animatedVessels.length > 0 ? animatedVessels : vessels.filter(vessel => vessel.latitude && vessel.longitude).map(vessel => ({
          name: vessel.name,
          lat: parseFloat(vessel.latitude!.toString()),
          lng: parseFloat(vessel.longitude!.toString()),
          origin: vessel.origin || null
        }))).map((vessel, index) => {
          // Determine if this is an animated vessel or static vessel
          const isAnimated = animatedVessels.length > 0;
          
          return (
          <Marker
            key={`${vessel.name}-${index}`}
            position={[vessel.lat, vessel.lng]}
            icon={createVesselIcon(vessel.origin)}
          >
            <Popup>
              <div className="p-2 min-w-[200px]">
                <h3 className="font-semibold text-lg text-slate-800 dark:text-slate-200 mb-2">
                  {vessel.name}
                </h3>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Ship className="w-4 h-4 text-slate-500" />
                    <span className="text-slate-600 dark:text-slate-400">
                      {isAnimated ? 'Animated Position' : 'Current Position'}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Navigation className="w-4 h-4 text-slate-500" />
                    <span className="text-slate-600 dark:text-slate-400">
                      Position: {vessel.lat.toFixed(4)}, {vessel.lng.toFixed(4)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Route className="w-4 h-4 text-slate-500" />
                    <span className="text-slate-600 dark:text-slate-400">
                      Origin: {vessel.origin || 'Unknown'}
                    </span>
                  </div>
                  
                  {isAnimated && timelineData[Math.floor(currentTime)] && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-500" />
                      <span className="text-slate-600 dark:text-slate-400">
                        Time: {new Date(timelineData[Math.floor(currentTime)].timestamp).toLocaleString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                          timeZone: 'UTC'
                        })} UTC
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
          );
        })}
      </MapContainer>

      {/* Animated Legend */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-white/95 dark:bg-slate-800/95 rounded-lg p-2 shadow-lg border border-slate-200 dark:border-slate-700 backdrop-blur-sm max-w-[140px]">
        <div className="space-y-2">
          {/* Vessel Count */}
          <div className="text-center">
            <div className="text-5xl font-bold text-slate-800 dark:text-slate-200 mb-1">
              <AnimatedCount count={vessels.length} />
            </div>
            <div className="flex items-center justify-center gap-1">
              <Ship className="w-3 h-3 text-slate-600 dark:text-slate-400" />
              <span className="text-xs text-slate-600 dark:text-slate-400">Vessels</span>
            </div>
          </div>

          {/* Origin Legend */}
          <div className="space-y-1">
            <h4 className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Origins</h4>
            {Object.entries(ORIGIN_COLORS).map(([origin, color]) => {
              const vesselCount = vessels.filter(v => 
                origin === 'unknown' ? !v.origin : v.origin?.toLowerCase() === origin
              ).length;
              
              if (vesselCount === 0) return null;
              
              return (
                <div key={origin} className="flex items-center gap-1">
                  <div 
                    className="w-2 h-2 rounded-full border border-white shadow-sm flex-shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-xs text-slate-600 dark:text-slate-400 capitalize truncate">
                    {origin === 'unknown' ? 'Unknown' : origin}: {vesselCount}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Professional Timeline Component */}
      {timelineData.length > 0 && timelineRange && (
        <div className="absolute bottom-6 left-6 right-6 z-[1000]">
          <div className="bg-slate-900/95 backdrop-blur-sm rounded-lg p-4 shadow-2xl border border-slate-700">
            {/* Timeline Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-semibold text-white">Vessel Timeline</h3>
                <div className="text-xs text-slate-400">
                  {timelineData.length} frames • {timelineRange.start.split('T')[0]} to {timelineRange.end.split('T')[0]}
                </div>
              </div>
              
              {/* Speed Control */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Speed:</span>
                <select 
                  value={playbackSpeed} 
                  onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
                  className="bg-slate-800 text-white text-xs px-2 py-1 rounded border border-slate-600"
                >
                  <option value={0.25}>0.25x</option>
                  <option value={0.5}>0.5x</option>
                  <option value={1}>1x</option>
                  <option value={2}>2x</option>
                  <option value={4}>4x</option>
                </select>
              </div>
            </div>

            {/* Playback Controls */}
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={skipToStart}
                className="p-2 hover:bg-slate-800 rounded transition-colors"
                title="Skip to start"
              >
                <SkipBack className="w-4 h-4 text-white" />
              </button>
              
              <button
                onClick={togglePlayPause}
                className="p-3 bg-blue-600 hover:bg-blue-700 rounded-full transition-colors"
                title={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 text-white" />
                ) : (
                  <Play className="w-5 h-5 text-white ml-0.5" />
                )}
              </button>
              
              <button
                onClick={skipToEnd}
                className="p-2 hover:bg-slate-800 rounded transition-colors"
                title="Skip to end"
              >
                <SkipForward className="w-4 h-4 text-white" />
              </button>
              
              <button
                onClick={resetTimeline}
                className="p-2 hover:bg-slate-800 rounded transition-colors"
                title="Reset"
              >
                <RotateCcw className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Timeline Scrubber */}
            <div className="relative">
              {/* Timeline Track */}
              <div className="h-8 bg-slate-800 rounded-lg relative overflow-hidden">
                {/* Time Markers */}
                <div className="absolute inset-0 flex">
                  {Array.from({ length: 10 }, (_, i) => (
                    <div key={i} className="flex-1 border-r border-slate-700 relative">
                      <div className="absolute top-1 left-1 text-xs text-slate-500">
                        {i === 0 ? 'Start' : i === 9 ? 'End' : ''}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Progress Bar */}
                <div 
                  className="absolute top-0 left-0 h-full bg-blue-600/30 transition-all duration-100"
                  style={{ width: `${(currentTime / (timelineData.length - 1)) * 100}%` }}
                />
                
                {/* Scrubber Handle */}
                <div 
                  className="absolute top-1/2 transform -translate-y-1/2 w-4 h-6 bg-blue-500 rounded-sm shadow-lg cursor-pointer hover:bg-blue-400 transition-colors"
                  style={{ left: `calc(${(currentTime / (timelineData.length - 1)) * 100}% - 8px)` }}
                />
              </div>
              
              {/* Current Time Display */}
              <div className="mt-2 text-center">
                <div className="text-xs text-slate-400">
                  Frame: {Math.floor(currentTime)} / {timelineData.length - 1}
                </div>
                {timelineData[Math.floor(currentTime)] && (
                  <div className="text-xs text-white font-mono">
                    {new Date(timelineData[Math.floor(currentTime)].timestamp).toLocaleString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      timeZone: 'UTC'
                    })} UTC
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Animated count component
function AnimatedCount({ count }: { count: number }) {
  const [displayCount, setDisplayCount] = useState(0);

  useEffect(() => {
    const duration = 1000; // 1 second
    const steps = 20;
    const stepDuration = duration / steps;
    const increment = count / steps;

    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      const newCount = Math.min(Math.floor(increment * currentStep), count);
      setDisplayCount(newCount);

      if (currentStep >= steps) {
        clearInterval(timer);
        setDisplayCount(count);
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [count]);

  return <span>{displayCount}</span>;
}
