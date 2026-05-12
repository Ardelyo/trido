import React from 'react';
import { motion } from 'motion/react';

export const LoadingDots: React.FC<{ message?: string }> = ({ message = 'Memproses dengan Gemma 4...' }) => {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-8">
      <div className="flex gap-2">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{
              y: [0, -10, 0],
              opacity: [0.3, 1, 0.3],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.2,
              ease: "easeInOut",
            }}
            className="w-3 h-3 bg-blue-600 rounded-full shadow-[0_0_12px_rgba(37,99,235,0.4)]"
          />
        ))}
      </div>
      <motion.span 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-[13px] font-black text-slate-400 tracking-widest uppercase"
      >
        {message}
      </motion.span>
      
      {/* Subtle realistic progress bar */}
      <div className="w-48 h-1 bg-slate-100 rounded-full overflow-hidden mt-2">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: '100%' }}
          transition={{ duration: 15, ease: "linear" }}
          className="h-full bg-blue-500/30"
        />
      </div>
    </div>
  );
};
