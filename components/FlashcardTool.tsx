
import React, { useState } from 'react';
import { motion } from 'motion/react';

interface FlashcardToolProps {
  config: {
    front?: string;
    back?: string;
  };
}

export const FlashcardTool: React.FC<FlashcardToolProps> = ({ config }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div 
      className="w-full h-full p-6 bg-slate-50 flex items-center justify-center cursor-pointer select-none"
      onClick={() => setIsFlipped(!isFlipped)}
      style={{ perspective: '1000px' }}
    >
      <motion.div
        className="relative w-full h-full"
        initial={false}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, type: 'spring', stiffness: 260, damping: 20 }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Front */}
        <div 
          className="absolute inset-0 w-full h-full bg-white border-2 border-trido/20 rounded-2xl shadow-xl flex flex-col items-center justify-center p-8 backface-hidden"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <span className="text-xs font-bold text-trido/30 uppercase tracking-widest mb-4">Pertanyaan</span>
          <h2 className="font-display text-2xl font-bold text-ink text-center leading-tight">
            {config.front || 'Front of Card'}
          </h2>
        </div>

        {/* Back */}
        <div 
          className="absolute inset-0 w-full h-full bg-trido border-2 border-trido/70 rounded-2xl shadow-xl flex flex-col items-center justify-center p-8 backface-hidden"
          style={{ 
            backfaceVisibility: 'hidden', 
            transform: 'rotateY(180deg)' 
          }}
        >
          <span className="text-xs font-bold text-trido/20 uppercase tracking-widest mb-4">Jawaban</span>
          <p className="text-xl text-white text-center leading-relaxed font-medium">
            {config.back || 'Back of Card'}
          </p>
        </div>
      </motion.div>
    </div>
  );
};
