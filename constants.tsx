
import React from 'react';
import { TileType } from './types';
import { Apple, Cog, Box, Rocket, Timer, Skull } from 'lucide-react';

export const GRID_SIZE = 7;

export const TILE_DATA: Record<TileType, { color: string; icon: React.ReactNode; label: string }> = {
  [TileType.GRAVITY]: { color: 'bg-[#FF1744]', icon: <Apple className="w-7 h-7 text-white fill-white/30" />, label: 'g' },
  [TileType.FORCE]: { color: 'bg-[#2979FF]', icon: <Cog className="w-7 h-7 text-white fill-white/30" />, label: 'F' },
  [TileType.MASS]: { color: 'bg-[#FF9100]', icon: <Box className="w-7 h-7 text-white fill-white/30" />, label: 'm' },
  [TileType.VELOCITY]: { color: 'bg-[#651FFF]', icon: <Rocket className="w-7 h-7 text-white fill-white/30" />, label: 'v' },
  [TileType.ACCELERATION]: { color: 'bg-[#00E676]', icon: <Timer className="w-7 h-7 text-white fill-white/30" />, label: 'a' },
  [TileType.OBSTACLE]: { color: 'bg-[#37474F]', icon: <Skull className="w-7 h-7 text-red-400" />, label: '!' },
};

export const INITIAL_REQUIRED_TARGET = 8;
