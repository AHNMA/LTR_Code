
import React, { useRef, useEffect } from 'react';

interface DottedGlowBackgroundProps {
  color?: string;
  className?: string;
  speed?: number; // Movement speed multiplier
  gap?: number;   // Gap between dots
  radius?: number; // Radius of dots
}

export const DottedGlowBackground: React.FC<DottedGlowBackgroundProps> = ({
  color = '#e10059',
  className = '',
  speed = 0.5,
  gap = 20,
  radius = 1.5,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    // Helper to convert hex to rgb for alpha manipulation
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result
        ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
          }
        : { r: 255, g: 255, b: 255 }; // Default white
    };

    const rgb = hexToRgb(color);

    const render = () => {
      time += speed * 0.01;
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Create a moving spotlight position based on time (slow figure-8 or wave)
      const centerX = canvas.width / 2 + Math.sin(time * 0.5) * (canvas.width * 0.3);
      const centerY = canvas.height / 2 + Math.cos(time * 0.3) * (canvas.height * 0.4);

      // Grid Calculation - Centered and Safe
      // Calculate how many dots fit
      const cols = Math.floor(canvas.width / gap);
      const rows = Math.floor(canvas.height / gap);
      
      // Calculate offset to center the grid
      // (cols - 1) * gap is the distance from first dot center to last dot center
      const gridWidth = (cols > 0 ? cols - 1 : 0) * gap;
      const gridHeight = (rows > 0 ? rows - 1 : 0) * gap;
      
      const offsetX = (canvas.width - gridWidth) / 2;
      const offsetY = (canvas.height - gridHeight) / 2;

      // Draw Grid
      for (let i = 0; i < cols; i++) {
        const x = offsetX + i * gap;
        
        // Extra Safety check for horizontal edges to ensure dot radius isn't clipped
        if (x < radius || x > canvas.width - radius) continue;

        for (let j = 0; j < rows; j++) {
          const y = offsetY + j * gap;
          
          // Extra Safety check for vertical edges
          if (y < radius || y > canvas.height - radius) continue;

          // Calculate distance from the "spotlight"
          const dx = x - centerX;
          const dy = y - centerY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          // Max range of the glow
          const range = Math.max(canvas.width, canvas.height) * 0.6;
          
          // Calculate opacity: High near center, low far away
          // Base opacity 0.1, max opacity 0.8
          let opacity = Math.max(0.05, 1 - Math.pow(distance / range, 1.5));
          
          // Add a subtle "breathing" effect to individual dots based on position
          const breathing = Math.sin(x * 0.1 + y * 0.1 + time * 2) * 0.1;
          opacity = Math.max(0.05, Math.min(0.8, opacity + breathing));

          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
          ctx.fill();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    const resizeObserver = new ResizeObserver(() => {
      if (container && canvas) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        // Don't restart loop, just resize
      }
    });

    resizeObserver.observe(container);
    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
    };
  }, [color, speed, gap, radius]);

  return (
    <div ref={containerRef} className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}>
      <canvas ref={canvasRef} className="block w-full h-full" />
      {/* Vignette Overlay for smooth fade edges */}
      <div className="absolute inset-0 bg-gradient-to-t from-f1-card via-transparent to-transparent opacity-50"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-white/5 opacity-20 mix-blend-overlay"></div>
    </div>
  );
};
