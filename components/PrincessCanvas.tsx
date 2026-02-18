
import React, { useRef, useEffect } from 'react';

interface PrincessCanvasProps {
  stability: number;
  width: number;
  height: number;
}

const PrincessCanvas: React.FC<PrincessCanvasProps> = ({ stability, width, height }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const isLow = stability < 40;
    const isCritical = stability < 20;

    const draw = (time: number) => {
      ctx.clearRect(0, 0, width, height);
      
      const centerX = width / 2;
      const centerY = height / 2 + 15;
      
      // Dynamic Animation Speeds
      const speedMult = isLow ? (isCritical ? 2.5 : 1.8) : 1.0;
      
      // Basic Animations (Synced with Stability)
      const bounce = Math.sin(time / (600 / speedMult)) * 4;
      const breatheScale = 1 + Math.sin(time / (1200 / speedMult)) * 0.025;
      const hairWave = Math.sin(time / (800 / speedMult)) * 3;
      const tilt = Math.sin(time / (2000 / speedMult)) * 0.05; // Head tilt speed up
      
      // Stress-induced Tremor
      const tremorX = isLow ? (Math.random() - 0.5) * (isCritical ? 6 : 2.5) : 0;
      const tremorY = isLow ? (Math.random() - 0.5) * (isCritical ? 6 : 2.5) : 0;
      
      // Eye State (Natural blinks and tracking)
      const isBlinking = (time % 4000) < 180;
      const pupilX = Math.sin(time / 1500) * 2;
      const pupilY = Math.cos(time / 2000) * 1;

      // 1. Shadow (Dynamic resizing)
      ctx.fillStyle = 'rgba(0,0,0,0.1)';
      ctx.beginPath();
      ctx.ellipse(centerX + tremorX, height - 10, 45 * breatheScale, 14 * breatheScale, 0, 0, Math.PI * 2);
      ctx.fill();

      // 2. Body / Lab Coat
      const bodyGrad = ctx.createLinearGradient(centerX - 30, centerY, centerX + 30, centerY);
      bodyGrad.addColorStop(0, isLow ? '#fecaca' : '#fbcfe8');
      bodyGrad.addColorStop(0.5, isLow ? '#f87171' : '#f472b6');
      bodyGrad.addColorStop(1, isLow ? '#ef4444' : '#db2777');
      
      ctx.save();
      ctx.translate(centerX + tremorX, centerY + 20);
      ctx.scale(breatheScale, breatheScale);
      ctx.fillStyle = bodyGrad;
      ctx.beginPath();
      ctx.moveTo(-25, 45);
      ctx.lineTo(25, 45);
      ctx.lineTo(20, 0);
      ctx.lineTo(-20, 0);
      ctx.closePath();
      ctx.fill();
      
      // Coat Lapels
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-10, 0); ctx.lineTo(-15, 12);
      ctx.moveTo(10, 0); ctx.lineTo(15, 12);
      ctx.stroke();
      ctx.restore();

      // 3. Hands (Floating/Reactive gestures)
      const drawHand = (offsetX: number, flip: boolean) => {
        const side = flip ? 1 : -1;
        const hCycle = time / (800 / speedMult);
        // Idle motion + extra shivering if stressed
        const hx = centerX + offsetX + tremorX + Math.cos(hCycle + (flip ? Math.PI : 0)) * 4;
        const hy = centerY + 25 + bounce + Math.sin(hCycle * 1.5) * 5;
        
        const handGrad = ctx.createRadialGradient(hx, hy, 0, hx, hy, 10);
        handGrad.addColorStop(0, '#fff5f5');
        handGrad.addColorStop(1, '#fee2e2');
        
        ctx.fillStyle = handGrad;
        ctx.beginPath();
        ctx.arc(hx, hy, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Finger tremors
        if (isLow && Math.random() > 0.7) {
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(0,0,0,0.08)';
            ctx.moveTo(hx - 2, hy - 4); ctx.lineTo(hx - 2, hy + 4);
            ctx.stroke();
        }
      };
      drawHand(-40, false);
      drawHand(40, true);

      // 4. Layered Hair (Voluminous parallax)
      const hairGrad = ctx.createLinearGradient(centerX - 40, centerY - 60, centerX + 40, centerY);
      hairGrad.addColorStop(0, '#db2777');
      hairGrad.addColorStop(1, '#9d174d');
      ctx.fillStyle = hairGrad;

      const drawHairBundle = (size: number, xOff: number, yOff: number, waveM: number) => {
        ctx.beginPath();
        const waveX = (hairWave * waveM);
        ctx.arc(centerX + tremorX + xOff + waveX, centerY + yOff + bounce + tremorY, size, 0, Math.PI * 2);
        ctx.fill();
      };
      
      // Back bundles
      drawHairBundle(24, -22, -22, 1.4);
      drawHairBundle(24, 22, -22, -1.4);
      drawHairBundle(26, 0, -32, 0.6);

      // 5. Head (Kawaii Physics-reactive)
      ctx.save();
      const headX = centerX + tremorX;
      const headY = centerY - 15 + bounce + tremorY;
      ctx.translate(headX, headY);
      ctx.rotate(tilt); // Reacts to speedMult

      const headGrad = ctx.createRadialGradient(-6, -8, 2, 0, 0, 26);
      headGrad.addColorStop(0, '#fff5f5');
      headGrad.addColorStop(1, '#fee2e2');
      
      ctx.fillStyle = headGrad;
      ctx.beginPath();
      ctx.arc(0, 0, 26, 0, Math.PI * 2);
      ctx.fill();
      
      // Reactive Blushing
      const blushBase = isLow ? 0.45 : 0.25;
      const blushAnim = Math.sin(time / (400 / speedMult)) * 0.1;
      ctx.fillStyle = `rgba(244, 114, 182, ${blushBase + blushAnim})`;
      ctx.beginPath();
      ctx.ellipse(-14, 7, 7, 4, 0, 0, Math.PI * 2);
      ctx.ellipse(14, 7, 7, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // 6. Eyes (Life-like detail)
      const drawEye = (offsetX: number) => {
        const ey = -4;
        if (isBlinking) {
          ctx.strokeStyle = '#374151';
          ctx.lineWidth = 3.5;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(offsetX - 7, ey);
          ctx.lineTo(offsetX + 7, ey);
          ctx.stroke();
        } else {
          // Eye Sclera
          ctx.fillStyle = '#fff';
          ctx.beginPath();
          ctx.ellipse(offsetX, ey, 8, 11, 0, 0, Math.PI * 2);
          ctx.fill();
          
          // Pupil
          const px = offsetX + pupilX + (isLow ? (Math.random() - 0.5) * 1.5 : 0);
          const py = ey + pupilY;
          ctx.fillStyle = isLow ? '#111827' : '#1f2937';
          ctx.beginPath();
          ctx.arc(px, py, 5, 0, Math.PI * 2);
          ctx.fill();
          
          // Shimmering Reflections
          ctx.fillStyle = '#fff';
          ctx.beginPath();
          ctx.arc(px - 2.5, py - 3.5, 2.2, 0, Math.PI * 2);
          ctx.arc(px + 1.8, py + 1.8, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }

        // Eyebrows (Dynamic Expressions)
        ctx.strokeStyle = '#9d174d';
        ctx.lineWidth = 2.8;
        ctx.lineCap = 'round';
        ctx.beginPath();
        if (isLow) {
          const furrow = offsetX > 0 ? -0.5 : 0.5;
          ctx.arc(offsetX, ey - 14, 9, Math.PI + furrow - 0.4, Math.PI + furrow + 0.4);
        } else {
          ctx.arc(offsetX, ey - 16, 9, Math.PI - 0.4, Math.PI + 0.4);
        }
        ctx.stroke();
      };
      drawEye(-12);
      drawEye(12);

      // 7. Mouth (Expression state)
      ctx.beginPath();
      ctx.strokeStyle = '#374151';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      if (isLow) {
        // Quivering O-shape
        const qv = Math.sin(time / 50) * 1.2;
        ctx.ellipse(0, 11 + qv, 4.5, isCritical ? 6 : 3.5, 0, 0, Math.PI * 2);
      } else {
        // Cheerful curve
        ctx.arc(0, 7, 8, 0.15 * Math.PI, 0.85 * Math.PI);
      }
      ctx.stroke();

      // 8. Crown (Royal detail)
      ctx.save();
      ctx.translate(0, -26);
      const crownGrad = ctx.createLinearGradient(-15, 0, 15, 0);
      crownGrad.addColorStop(0, '#fcd34d');
      crownGrad.addColorStop(0.5, '#fbbf24');
      crownGrad.addColorStop(1, '#d97706');
      ctx.fillStyle = crownGrad;
      ctx.beginPath();
      ctx.moveTo(-18, 0);
      ctx.lineTo(-12, -16);
      ctx.lineTo(-6, -6);
      ctx.lineTo(0, -20);
      ctx.lineTo(6, -6);
      ctx.lineTo(12, -16);
      ctx.lineTo(18, 0);
      ctx.closePath();
      ctx.fill();
      // Glowing Gem
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(0, -9, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.restore(); // Head transform end

      // 9. Extra Stress Visualization
      if (isLow) {
        const sweatRate = isCritical ? 1500 : 2500;
        if ((time % sweatRate) < 1000) {
            const sweatProg = ((time % 1000) / 1000);
            ctx.fillStyle = '#60a5fa';
            ctx.beginPath();
            ctx.ellipse(headX + 24, headY - 4 + sweatProg * 22, 2.2, 3.5, 0, 0, Math.PI * 2);
            ctx.fill();
        }
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    animationFrameId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animationFrameId);
  }, [stability, width, height]);

  return (
    <canvas 
      ref={canvasRef} 
      width={width} 
      height={height} 
      className="drop-shadow-2xl pointer-events-none"
    />
  );
};

export default PrincessCanvas;
