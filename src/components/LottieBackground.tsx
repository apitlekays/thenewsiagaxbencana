'use client';

import { DotLottieReact } from '@lottiefiles/dotlottie-react';

const LottieBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 opacity-20">
        <DotLottieReact
          src="/animations/homebg.lottie"
          loop
          autoplay
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    </div>
  );
};

export default LottieBackground; 