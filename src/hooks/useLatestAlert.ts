import { useEffect, useState } from 'react';

const ENDPOINT = 'https://n8n.drhafizhanif.net/webhook/fetch-met-data';

export interface ThunderRainAlert {
  Date: string;
  Msg_EN: string;
  Msg_MY: string;
  Valid_from: string;
  Valid_to: string;
}

export function useLatestAlert(intervalMs: number = 60000) {
  const [latest, setLatest] = useState<ThunderRainAlert | null>(null);

  async function fetchAlert() {
    try {
      const res = await fetch(ENDPOINT);
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setLatest(data[0]);
      } else {
        setLatest(null);
      }
    } catch {
      setLatest(null);
    }
  }

  useEffect(() => {
    fetchAlert();
    const id = setInterval(fetchAlert, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return latest;
} 