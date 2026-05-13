import React from 'react';
import { motion } from 'framer-motion';

// =================== LOADING SPINNER ===================
const LoadingSpinner = ({ fullScreen = false, size = 'md', text = '' }) => {
  const sizes = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12', xl: 'w-16 h-16' };

  const spinner = (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className={`${sizes[size]} border-2 border-dark-700 border-t-primary-500 rounded-full animate-spin`} />
      {text && <p className="text-dark-400 text-sm">{text}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-dark-950 flex items-center justify-center z-50">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-4 border-primary-500/20 rounded-full" />
            <div className="absolute inset-0 border-4 border-transparent border-t-primary-500 rounded-full animate-spin" />
            <div className="absolute inset-2 border-4 border-transparent border-t-accent-purple rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
          </div>
          <p className="text-gradient font-bold text-lg">AuctionPro</p>
          {text && <p className="text-dark-400 text-sm">{text}</p>}
        </div>
      </div>
    );
  }

  return spinner;
};

export default LoadingSpinner;
