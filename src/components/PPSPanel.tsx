import { useEffect, useState, forwardRef } from 'react';
import { FaChevronDown, FaChevronRight, FaUsers, FaUserFriends, FaChild, FaBaby, FaMale } from 'react-icons/fa';

interface PPSPoint {
  id: string;
  pic: string;
  nama: string;
  idnegeri: string;
  iddaerah: string;
  idmukim: string;
  negeri: string;
  daerah: string;
  mukim: string;
  seasonmain_id: string;
  season_id: string;
  seasondaerah_id: string;
  buka: string;
  kapasiti: string;
  kapasitiDouble: number;
  mangsa: string;
  keluarga: string;
  lelaki_dewasa: string;
  perempuan_dewasa: string;
  kanak_lelaki: string;
  kanak_perempuan: string;
  bayi_lelaki: string;
  bayi_perempuan: string;
}

const FETCH_INTERVAL = 900000; // 15 minutes in ms

const negeriToCode: Record<string, string> = {
  'Johor': 'jhr',
  'Kedah': 'kdh',
  'Kelantan': 'ktn',
  'Melaka': 'mlk',
  'Negeri Sembilan': 'nsn',
  'Pahang': 'phg',
  'Pulau Pinang': 'png',
  'Penang': 'png',
  'Perak': 'prk',
  'Perlis': 'pls',
  'Sabah': 'sbh',
  'Sarawak': 'swk',
  'Selangor': 'sgr',
  'Terengganu': 'trg',
  'Kuala Lumpur': 'kul',
  'Labuan': 'lbn',
  'Putrajaya': 'pjy',
  'Wilayah Persekutuan': 'ft',
};

const PPSPanel = forwardRef<HTMLDivElement>((props, ref) => {
  const [points, setPoints] = useState<PPSPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const fetchPPSData = () => {
    fetch('https://n8n.drhafizhanif.net/webhook/detail-pps-data')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch PPS data');
        return res.json();
      })
      .then((data: unknown) => {
        if (!Array.isArray(data)) { setPoints([]); setLoading(false); return; }
        setPoints(data as PPSPoint[]);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load PPS data');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchPPSData();
    const interval = setInterval(fetchPPSData, FETCH_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  return (
    <div ref={ref} className="w-[500px] max-w-full bg-gray-900/90 backdrop-blur-md rounded-sm border border-blue-800 shadow-2xl transition-all duration-500 ease-in-out flex flex-col">
      <div className="flex items-center justify-between px-6 py-3 border-b border-blue-800">
        <div className="flex items-center gap-3">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 3 L22 21 Q23 23 20 23 H15 Q14 23 13.5 22 L12 19 L10.5 22 Q10 23 9 23 H4 Q1 23 2 21 L12 3 Z" fill="#3B82F6" />
            </svg>
          <h2 className="text-blue-200 font-bold text-lg tracking-tight">Pusat Pemindahan Sementara (PPS)</h2>
        </div>
        <span className="text-xs text-blue-300 font-semibold">{points.length} lokasi</span>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2" style={{ maxHeight: '230px' }}>
        {loading && <div className="text-blue-300 text-center">Loading...</div>}
        {error && <div className="text-red-400 text-center">{error}</div>}
        {!loading && !error && points.length === 0 && (
          <div className="text-blue-300 text-center">No PPS open at this time.</div>
        )}
        {!loading && !error && points.map((p) => (
          <div key={p.id} className="space-y-2">
            {/* Main PPS Card */}
            <div className="bg-blue-900/40 border border-blue-700 rounded-sm p-3 flex flex-row gap-3 shadow-lg transition-all duration-200 hover:shadow-2xl">
              {/* Toggle Button */}
              <div className="flex items-center" style={{ minWidth: '35px' }}>
                <button
                  onClick={() => toggleExpanded(p.id)}
                  className="text-blue-400 hover:text-blue-300 transition-colors duration-200 p-1 rounded-sm hover:bg-blue-800/30"
                >
                  {expandedItems.has(p.id) ? (
                    <FaChevronDown className="w-4 h-4" />
                  ) : (
                    <FaChevronRight className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Main Content */}
              <div className="flex-1 min-w-0">
                {/* Header Row */}
                <div className="flex items-center gap-2">
                  <span
                    className={`malaysia-state-flag-icon malaysia-state-flag-icon-${negeriToCode[p.negeri] || 'ft'} w-5 h-3 rounded shadow border border-gray-700 flex-shrink-0`}
                    title={p.negeri}
                  ></span>
                  <span className="text-blue-100 font-semibold text-sm truncate" title={p.nama}>{p.nama}</span>
                </div>

                {/* Location Info */}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-blue-200 mb-3">
                  <span>Daerah: <span className="font-semibold">{p.daerah}</span></span>
                  <span>Mukim: <span className="font-semibold">{p.mukim}</span></span>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-blue-950/60 rounded-sm border border-blue-700 px-2 py-1.5 text-center">
                    <div className="text-[10px] text-blue-300 font-medium">Buka</div>
                    <div className="text-[11px] font-bold text-yellow-100">{p.buka}</div>
                  </div>
                  <div className="bg-blue-950/60 rounded-sm border border-blue-700 px-2 py-1.5 text-center">
                    <div className="text-[10px] text-blue-300 font-medium">Mangsa</div>
                    <div className="text-[11px] font-bold text-blue-100">{p.mangsa}</div>
                  </div>
                  <div className="bg-blue-950/60 rounded-sm border border-blue-700 px-2 py-1.5 text-center">
                    <div className="text-[10px] text-blue-300 font-medium">Keluarga</div>
                    <div className="text-[11px] font-bold text-purple-100">{p.keluarga}</div>
                  </div>
                </div>
              </div>

              {/* Capacity Chart */}
              <div className="flex items-center justify-center ml-2 flex-shrink-0">
                {(() => {
                  const kapasitiValue = parseInt(p.kapasiti.replace('%', ''));
                  const value = Math.min(kapasitiValue, 100);
                  let color = '#1de9b6'; // default green
                  if (value > 75) color = '#ef4444'; // red
                  else if (value > 50) color = '#f97316'; // orange
                  else if (value > 25) color = '#eab308'; // yellow
                  return (
                    <svg width="85" height="95" viewBox="0 0 85 95">
                      {/* Background ring */}
                      <circle cx="32" cy="32" r="25" fill="none" stroke="#334155" strokeWidth="5" />
                      {/* Progress arc */}
                      <circle
                        cx="32" cy="32" r="25"
                        fill="none"
                        stroke={color}
                        strokeWidth="5"
                        strokeDasharray={Math.PI * 2 * 25}
                        strokeDashoffset={Math.PI * 2 * 25 * (1 - value / 100)}
                        strokeLinecap="round"
                        transform="rotate(-90 32 32)"
                      />
                      <text x="32" y="36" textAnchor="middle" fontSize="16" fontWeight="bold" fill={color}>{p.kapasiti}</text>
                      <text x="32" y="85" textAnchor="middle" fontSize="11" fontWeight="500" fill="#94a3b8">Kapasiti</text>
                    </svg>
                  );
                })()}
              </div>
            </div>

            {/* Detailed Statistics Panel */}
            {expandedItems.has(p.id) && (
              <div className="bg-blue-950/40 border border-blue-600 rounded-sm p-4 ml-8 shadow-lg">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Demographics Overview */}
                  <div className="space-y-3">
                    <h4 className="text-blue-200 font-semibold text-sm flex items-center gap-2 border-b border-blue-700 pb-2">
                      <FaUsers className="text-blue-400" />
                      Demographics Overview
                    </h4>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-blue-900/40 rounded-sm pt-2 pb-1 border border-blue-700 flex flex-col items-center">
                        <div className="flex items-center gap-2 text-xs text-blue-300 mb-1">
                          <FaMale className="text-blue-400 w-8 h-8" />
                        </div>
                        <div className="text-blue-100 font-bold text-base">
                          {parseInt(p.lelaki_dewasa) + parseInt(p.perempuan_dewasa)}
                        </div>
                      </div>
                      <div className="bg-blue-900/40 rounded-sm pt-2 pb-1 border border-blue-700 flex flex-col items-center">
                        <div className="flex items-center gap-2 text-xs text-blue-300 mb-1">
                          <FaChild className="text-green-400 w-8 h-8" />
                        </div>
                        <div className="text-green-100 font-bold text-base">
                          {parseInt(p.kanak_lelaki) + parseInt(p.kanak_perempuan)}
                        </div>
                      </div>
                      <div className="bg-blue-900/40 rounded-sm pt-2 pb-1 border border-blue-700 flex flex-col items-center">
                        <div className="flex items-center gap-2 text-xs text-blue-300 mb-1">
                          <FaBaby className="text-purple-400 w-8 h-8" />
                        </div>
                        <div className="text-purple-100 font-bold text-base">
                          {parseInt(p.bayi_lelaki) + parseInt(p.bayi_perempuan)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Detailed Breakdown */}
                  <div className="space-y-3">
                    <h4 className="text-blue-200 font-semibold text-sm flex items-center gap-2 border-b border-blue-700 pb-2">
                      <FaUserFriends className="text-blue-400" />
                      Detailed Breakdown
                    </h4>
                    <div className="space-y-2">
                      <div className="bg-blue-900/40 rounded-sm p-2 border border-blue-700">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-blue-300">Lelaki Dewasa</span>
                          <span className="text-blue-100 font-semibold text-sm">{p.lelaki_dewasa}</span>
                        </div>
                      </div>
                      <div className="bg-blue-900/40 rounded-sm p-2 border border-blue-700">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-blue-300">Perempuan Dewasa</span>
                          <span className="text-pink-100 font-semibold text-sm">{p.perempuan_dewasa}</span>
                        </div>
                      </div>
                      <div className="bg-blue-900/40 rounded-sm p-2 border border-blue-700">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-blue-300">Kanak Lelaki</span>
                          <span className="text-green-100 font-semibold text-sm">{p.kanak_lelaki}</span>
                        </div>
                      </div>
                      <div className="bg-blue-900/40 rounded-sm p-2 border border-blue-700">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-blue-300">Kanak Perempuan</span>
                          <span className="text-green-100 font-semibold text-sm">{p.kanak_perempuan}</span>
                        </div>
                      </div>
                      <div className="bg-blue-900/40 rounded-sm p-2 border border-blue-700">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-blue-300">Bayi Lelaki</span>
                          <span className="text-purple-100 font-semibold text-sm">{p.bayi_lelaki}</span>
                        </div>
                      </div>
                      <div className="bg-blue-900/40 rounded-sm p-2 border border-blue-700">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-blue-300">Bayi Perempuan</span>
                          <span className="text-purple-100 font-semibold text-sm">{p.bayi_perempuan}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
});

PPSPanel.displayName = 'PPSPanel';
export default PPSPanel; 