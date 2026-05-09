import React, { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  isListening: boolean;
  audioData: Uint8Array;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ isListening, audioData }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!isListening || !canvasRef.current || audioData.length === 0) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    
    ctx.clearRect(0, 0, width, height);
    
    const barCount = 12; // Fewer bars for cleaner look
    const barWidth = Math.floor(width / barCount) - 2;
    
    // Create soft gradient
    const gradient = ctx.createLinearGradient(0, height, 0, 0);
    gradient.addColorStop(0, 'rgba(37, 99, 235, 0.4)');  // blue-600
    gradient.addColorStop(0.5, 'rgba(59, 130, 246, 0.8)'); // blue-500
    gradient.addColorStop(1, 'rgba(96, 165, 250, 1)'); // blue-400

    ctx.fillStyle = gradient;

    for (let i = 0; i < barCount; i++) {
        // take lower frequencies mostly
        let dataLen = audioData.length;
        const index = dataLen ? Math.floor((i / barCount) * (dataLen * 0.4)) : 0;
        const value = dataLen ? audioData[index] || 0 : 0;
        
        // Non-linear scaling for better visuals
        const percent = Math.pow(value / 255, 1.5);
        let barHeight = Math.max(4, height * percent);
        
        // Add some random variation to make it look alive even when quiet
        if (isListening && value < 10) {
            barHeight = Math.max(4, 4 + Math.random() * 8);
        }

        const x = i * (width / barCount);
        const y = height - barHeight;
        
        ctx.beginPath();
        if(ctx.roundRect) {
            ctx.roundRect(x, y, barWidth, barHeight, 4);
        } else { // fallback
            ctx.rect(x, y, barWidth, barHeight);
        }
        ctx.fill();
    }
  }, [audioData, isListening]);

  if (!isListening) return null;

  return (
    <canvas 
      ref={canvasRef} 
      width={120} 
      height={32} 
      className="w-[120px] h-[32px] opacity-80"
    />
  );
};
