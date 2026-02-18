
import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Bomb } from 'lucide-react';
import PrincessCanvas from './PrincessCanvas';

interface LabParticle {
  id: number;
  x: number;
  y: number;
  type: 'drop' | 'shimmer';
  size: number;
  duration: number;
}

interface PhysicsLabProps {
  stability: number;
  level: number;
  isExploding: boolean;
  imageUrl: string | null;
}

const PhysicsLab: React.FC<PhysicsLabProps> = ({ stability, level, isExploding }) => {
  const [particles, setParticles] = useState<LabParticle[]>([]);

  const isLow = stability < 40;
  const isCritical = stability < 20;

  // Effect for standard falling "drops"
  useEffect(() => {
    const rate = stability < 30 ? 300 : 1200;
    const interval = setInterval(() => {
      setParticles(prev => [
        ...prev.slice(-25),
        {
          id: Date.now() + Math.random(),
          x: Math.random() * 95 + 2.5,
          y: -20,
          type: 'drop',
          size: Math.random() * 3 + 2,
          duration: stability < 30 ? 1.5 : 2.5
        }
      ]);
    }, rate);
    return () => clearInterval(interval);
  }, [stability]);

  // Effect for shimmering "stress" particles when stability is low
  useEffect(() => {
    if (!isLow) return;
    
    const shimmerRate = isCritical ? 100 : 250;
    const interval = setInterval(() => {
      setParticles(prev => [
        ...prev.slice(-35),
        {
          id: Math.random(),
          x: Math.random() * 100,
          y: Math.random() * 100,
          type: 'shimmer',
          size: Math.random() * 4 + 1,
          duration: Math.random() * 1.5 + 0.5
        }
      ]);
    }, shimmerRate);
    
    return () => clearInterval(interval);
  }, [isLow, isCritical]);

  return (
    <motion.div 
      animate={isLow ? { x: [-1.5, 1.5, -1.5] } : {}}
      transition={{ repeat: Infinity, duration: 0.1 }}
      className={`clay-card relative w-full h-80 overflow-hidden border-4 shadow-2xl transition-colors duration-500 ${isLow ? 'bg-red-50 border-red-300' : 'bg-white border-white'}`}
    >
      <AnimatePresence>
        {isLow && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: [0.05, 0.15, 0.05] }} 
            exit={{ opacity: 0 }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute inset-0 bg-red-500 pointer-events-none"
          />
        )}
      </AnimatePresence>

      <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '25px 25px' }} />

      {/* Animated Procedural Princess */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pt-8">
         <div className="relative z-10 w-full h-full flex items-center justify-center">
            <PrincessCanvas stability={stability} width={300} height={300} />
            
            <AnimatePresence>
              {isLow && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }} 
                  animate={{ opacity: 1, scale: 1 }} 
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                >
                   <div className="bg-red-500/10 p-12 rounded-full blur-2xl animate-pulse" />
                </motion.div>
              )}
            </AnimatePresence>
         </div>
         
         <motion.div 
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           className={`absolute bottom-6 px-6 py-2 rounded-full font-black text-[10px] border-2 shadow-xl transition-all duration-300 uppercase tracking-widest z-20 ${isLow ? 'bg-red-600 text-white border-red-400 animate-bounce' : 'bg-white text-pink-500 border-pink-100'}`}
         >
           {isLow ? 'CORE INSTABILITY DETECTED!' : 'LAB RESEARCH IN PROGRESS'}
         </motion.div>
      </div>

      {/* Particle Effects Layer */}
      <div className="absolute inset-0 pointer-events-none z-10">
        <AnimatePresence>
          {particles.map(p => (
            <motion.div
              key={p.id}
              initial={p.type === 'drop' ? { y: p.y, x: `${p.x}%`, opacity: 0 } : { x: `${p.x}%`, y: `${p.y}%`, opacity: 0, scale: 0 }}
              animate={p.type === 'drop' 
                ? { y: 350, opacity: [0, 1, 1, 0] } 
                : { 
                    opacity: [0, 0.8, 0], 
                    scale: [0, 1.2, 0],
                    filter: ["blur(0px)", "blur(2px)", "blur(0px)"]
                  }
              }
              exit={{ opacity: 0 }}
              transition={{ duration: p.duration, ease: p.type === 'drop' ? "linear" : "easeInOut" }}
              style={{
                width: p.size,
                height: p.size,
                backgroundColor: p.type === 'shimmer' ? (isCritical ? '#fca5a5' : '#fbcfe8') : (isLow ? '#f87171' : '#f9a8d4'),
                boxShadow: p.type === 'shimmer' ? `0 0 10px ${isCritical ? '#ef4444' : '#f472b6'}` : 'none'
              }}
              className="absolute rounded-full"
            />
          ))}
        </AnimatePresence>
      </div>

      <div className="absolute top-6 left-10 right-10 flex flex-col items-center z-30 pointer-events-none">
        <div className="flex justify-between w-full mb-2">
           <span className={`text-[9px] font-black uppercase tracking-[0.3em] ${isLow ? 'text-red-600 animate-pulse' : 'text-gray-400'}`}>
             Core Integrity
           </span>
           <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
             Level {level}
           </span>
        </div>
        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden shadow-inner border-2 border-white">
           <motion.div 
            className={`h-full transition-colors duration-500 ${isLow ? 'bg-gradient-to-r from-red-600 to-red-400' : 'bg-gradient-to-r from-pink-300 to-pink-500'}`}
            animate={{ width: `${stability}%` }}
           />
        </div>
      </div>

      <AnimatePresence>
        {isExploding && (
          <motion.div 
            initial={{ scale: 0, opacity: 0 }} 
            animate={{ scale: 12, opacity: 1 }} 
            className="absolute inset-0 flex items-center justify-center z-[100] bg-red-600 rounded-full"
          >
             <Bomb className="text-white w-full h-full p-20" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default PhysicsLab;
