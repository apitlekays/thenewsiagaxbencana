import { useLatestAlert } from '@/hooks/useLatestAlert';

export default function ScrollingAlertBanner() {
  const alert = useLatestAlert(300000); // fetch every 60s

  const message = alert
    ? alert.Msg_EN
    : 'No current weather update for now. Stay tuned for updated data';

  // Repeat the message 3 times for a long scroll
  const repeatedMessage = Array(3).fill(message).join('   •   ');

  return (
    <div className="fixed top-4 right-6 w-full z-50 pointer-events-none flex justify-end hidden md:flex">
      <div className="relative flex items-center w-[80vw] h-10 bg-gray-900/80 shadow-md overflow-hidden rounded-tr-sm rounded-br-sm">
        {/* Marquee text (runs under label) */}
        <div className="absolute left-0 top-0 w-full h-full flex items-center overflow-hidden whitespace-nowrap">
          <span className="marquee__inner font-semibold text-sm md:text-base px-4 text-white opacity-80 whitespace-nowrap">
            {repeatedMessage}
          </span>
        </div>
        {/* Label box overlays the marquee */}
        <div
          className="relative z-10 flex items-center h-full px-4 bg-yellow-600 text-white font-bold text-xs md:text-base whitespace-nowrap select-none rounded-tl-sm rounded-bl-sm"
          style={{ minWidth: '220px', height: '100%', boxShadow: '2px 0 8px 0 rgba(0,0,0,0.04)' }}
        >
          MET Malaysia Weather Forecast
        </div>
      </div>
    </div>
  );
} 