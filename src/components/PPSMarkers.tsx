import { useEffect, useState } from 'react';
import { Marker } from 'react-leaflet';
import L from 'leaflet';

interface PPSPoint {
  id: number;
  name: string;
  latti: number;
  longi: number;
  negeri: string;
  daerah: string;
  mukim: string;
  bencana: string;
  mangsa: number;
  keluarga: number;
  kapasiti: number;
}

// Tent SVG icon
const tentIcon = new L.DivIcon({
  className: '',
  html: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 3 L22 21 Q23 23 20 23 H15 Q14 23 13.5 22 L12 19 L10.5 22 Q10 23 9 23 H4 Q1 23 2 21 L12 3 Z" fill="#3B82F6" />
  </svg>`,
  iconSize: [12, 12],
  iconAnchor: [6, 6],
});

export default function PPSMarkers() {
  const [points, setPoints] = useState<PPSPoint[]>([]);

  useEffect(() => {
    fetch('https://n8n.drhafizhanif.net/webhook/pps-buka')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch PPS data');
        return res.json();
      })
      .then((data: unknown) => {
        if (!Array.isArray(data)) { setPoints([]); return; }
        const allPoints = data.flatMap((item: { points?: PPSPoint[] }) => item.points || []);
        setPoints(allPoints);
      })
      .catch(() => {
        setPoints([]);
      });
  }, []);

  return (
    <>
      {points.map((p) => (
        <Marker
          key={p.id}
          position={[p.latti, p.longi]}
          icon={tentIcon}
          zIndexOffset={1000}
        />
      ))}
    </>
  );
} 