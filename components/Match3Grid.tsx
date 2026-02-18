
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tile, TileType } from '../types';
import { GRID_SIZE, TILE_DATA } from '../constants';
import { Zap } from 'lucide-react';
import { soundService } from '../services/soundService';

interface Match3GridProps {
  onMatch: (matches: { type: TileType; count: number }[], clearedObstacles: boolean) => void;
  level: number;
}

const Match3Grid: React.FC<Match3GridProps> = ({ onMatch, level }) => {
  const [grid, setGrid] = useState<Tile[][]>([]);
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showZap, setShowZap] = useState(false);

  const createInitialGrid = useCallback(() => {
    const newGrid: Tile[][] = [];
    const validTypes = Object.values(TileType).filter(t => t !== TileType.OBSTACLE);
    
    for (let y = 0; y < GRID_SIZE; y++) {
      const row: Tile[] = [];
      for (let x = 0; x < GRID_SIZE; x++) {
        const isObstacle = Math.random() < Math.min(0.2, (level - 1) * 0.05);
        const type = isObstacle ? TileType.OBSTACLE : validTypes[Math.floor(Math.random() * validTypes.length)];
        row.push({ id: `${x}-${y}-${Math.random()}`, type, x, y });
      }
      newGrid.push(row);
    }
    return newGrid;
  }, [level]);

  useEffect(() => {
    setGrid(createInitialGrid());
  }, [createInitialGrid]);

  const findMatchGroups = (currentGrid: Tile[][]) => {
    const groups: Set<string>[] = [];
    
    // Horizontal
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE - 2; x++) {
        const type = currentGrid[y][x].type;
        if (type === TileType.OBSTACLE) continue;
        if (type === currentGrid[y][x + 1].type && type === currentGrid[y][x + 2].type) {
          const group = new Set<string>();
          group.add(`${x},${y}`); group.add(`${x+1},${y}`); group.add(`${x+2},${y}`);
          let nextX = x + 3;
          while (nextX < GRID_SIZE && currentGrid[y][nextX].type === type) {
            group.add(`${nextX},${y}`);
            nextX++;
          }
          groups.push(group);
          x = nextX - 1;
        }
      }
    }
    // Vertical
    for (let x = 0; x < GRID_SIZE; x++) {
      for (let y = 0; y < GRID_SIZE - 2; y++) {
        const type = currentGrid[y][x].type;
        if (type === TileType.OBSTACLE) continue;
        if (type === currentGrid[y + 1][x].type && type === currentGrid[y + 2][x].type) {
          const group = new Set<string>();
          group.add(`${x},${y}`); group.add(`${x},${y+1}`); group.add(`${x},${y+2}`);
          let nextY = y + 3;
          while (nextY < GRID_SIZE && currentGrid[nextY][x].type === type) {
            group.add(`${x},${nextY}`);
            nextY++;
          }
          groups.push(group);
          y = nextY - 1;
        }
      }
    }
    return groups;
  };

  const processGrid = useCallback(async (currentGrid: Tile[][]) => {
    const groups = findMatchGroups(currentGrid);
    if (groups.length === 0) {
      setIsProcessing(false);
      return;
    }

    setIsProcessing(true);
    const matchDetails: { type: TileType; count: number }[] = [];
    let clearedObstacles = false;

    // Play match sound
    soundService.playMatch();

    // Check for 5-match
    if (groups.some(g => g.size >= 5)) {
      clearedObstacles = true;
      setShowZap(true);
      soundService.playZap();
      setTimeout(() => setShowZap(false), 1000);
    }

    const markedGrid = currentGrid.map(row => row.map(tile => ({ ...tile })));
    const allMatchedCoords = new Set<string>();
    groups.forEach(group => {
      group.forEach(coord => allMatchedCoords.add(coord));
    });

    allMatchedCoords.forEach(coord => {
      const [mx, my] = coord.split(',').map(Number);
      matchDetails.push({ type: markedGrid[my][mx].type, count: 1 });
      markedGrid[my][mx].isMatched = true;
    });

    // If 5-match happened, mark obstacles for removal too
    if (clearedObstacles) {
      markedGrid.forEach(row => row.forEach(tile => {
        if (tile.type === TileType.OBSTACLE) tile.isMatched = true;
      }));
    }

    setGrid(markedGrid);
    await new Promise(r => setTimeout(r, 300));

    const validTypes = Object.values(TileType).filter(t => t !== TileType.OBSTACLE);
    const refilledGrid = markedGrid.map(row => row.map(tile => ({ ...tile })));
    for (let x = 0; x < GRID_SIZE; x++) {
      let emptyCount = 0;
      for (let y = GRID_SIZE - 1; y >= 0; y--) {
        if (refilledGrid[y][x].isMatched) {
          emptyCount++;
        } else if (emptyCount > 0) {
          refilledGrid[y + emptyCount][x] = { ...refilledGrid[y][x], y: y + emptyCount };
          refilledGrid[y][x].isMatched = true;
        }
      }
      for (let y = 0; y < emptyCount; y++) {
        const isObstacle = Math.random() < Math.min(0.2, (level - 1) * 0.05);
        refilledGrid[y][x] = {
          id: `${x}-${y}-${Math.random()}`,
          type: isObstacle ? TileType.OBSTACLE : validTypes[Math.floor(Math.random() * validTypes.length)],
          x,
          y,
          isMatched: false
        };
      }
    }

    setGrid(refilledGrid.map(row => row.map(t => ({ ...t, isMatched: false }))));
    onMatch(matchDetails, clearedObstacles);
    setTimeout(() => processGrid(refilledGrid), 300);
  }, [onMatch, level]);

  const handleTileClick = (x: number, y: number) => {
    if (isProcessing) return;
    if (grid[y][x].type === TileType.OBSTACLE) return;

    if (!selected) { setSelected([x, y]); return; }

    const [sx, sy] = selected;
    const isAdjacent = (Math.abs(sx - x) === 1 && sy === y) || (Math.abs(sy - y) === 1 && sx === x);

    if (isAdjacent) {
      const newGrid = grid.map(row => row.map(tile => ({ ...tile })));
      const tempType = newGrid[y][x].type;
      newGrid[y][x].type = newGrid[sy][sx].type;
      newGrid[sy][sx].type = tempType;
      
      const groups = findMatchGroups(newGrid);
      if (groups.length > 0) {
        setGrid(newGrid);
        processGrid(newGrid);
      } else {
        setSelected(null);
      }
      setSelected(null);
    } else {
      setSelected([x, y]);
    }
  };

  return (
    <div className="clay-card p-6 border-4 border-white bg-gray-50/50 relative">
      <AnimatePresence>
        {showZap && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1.2 }}
            exit={{ opacity: 0, scale: 2 }}
            className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none"
          >
            <div className="bg-yellow-400 p-8 rounded-full shadow-2xl">
              <Zap className="w-24 h-24 text-white fill-white" />
              <p className="text-white font-black text-xl text-center">OBSTACLES CLEARED!</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-7 gap-2">
        {grid.map((row, y) =>
          row.map((tile, x) => (
            <AnimatePresence mode="popLayout" key={tile.id}>
              {!tile.isMatched && (
                <motion.button
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, rotate: 45, opacity: 0 }}
                  whileHover={tile.type === TileType.OBSTACLE ? {} : { scale: 1.05, y: -2 }}
                  whileTap={tile.type === TileType.OBSTACLE ? {} : { scale: 0.9 }}
                  onClick={() => handleTileClick(x, y)}
                  className={`clay-tile w-10 h-10 sm:w-14 sm:h-14 flex items-center justify-center transition-all relative ${
                    TILE_DATA[tile.type].color
                  } ${selected && selected[0] === x && selected[1] === y ? 'ring-4 ring-white ring-offset-2 ring-offset-blue-400 z-10' : ''} ${tile.type === TileType.OBSTACLE ? 'cursor-not-allowed grayscale-[0.5]' : ''}`}
                >
                  {TILE_DATA[tile.type].icon}
                </motion.button>
              )}
            </AnimatePresence>
          ))
        )}
      </div>
    </div>
  );
};

export default Match3Grid;
