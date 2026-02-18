
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Target, Bomb, Zap, Trophy, Loader2, Play, User, LogOut, RotateCcw } from 'lucide-react';
import { ChallengeTopic, GameState, PhysicsQuestion, TileType, Difficulty, WordChallenge, LeaderboardEntry } from './types';
import { INITIAL_REQUIRED_TARGET, TILE_DATA } from './constants';
import PhysicsLab from './components/PhysicsLab';
import Match3Grid from './components/Match3Grid';
import QuestionModal from './components/QuestionModal';
import WordChallengeModal from './components/WordChallengeModal';
import { generatePhysicsQuestion, generateKawaiiPrincess, generateWordChallenge } from './services/geminiService';
import { soundService } from './services/soundService';

const App: React.FC = () => {
  const [playerName, setPlayerName] = useState('');
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    stability: 100,
    level: 1,
    topic: ChallengeTopic.GENERAL_KNOWLEDGE,
    isGameOver: false,
    collectedTargetCount: 0,
    requiredTargetCount: INITIAL_REQUIRED_TARGET,
    currentTargetType: TileType.GRAVITY,
    isExploding: false,
    princessImageUrl: null,
    isWordChallengeMode: false
  });

  const [activeQuestion, setActiveQuestion] = useState<PhysicsQuestion | null>(null);
  const [activeWordChallenge, setActiveWordChallenge] = useState<WordChallenge | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  // Initialize Princess Image & Leaderboard
  useEffect(() => {
    const initPrincess = async () => {
      const url = await generateKawaiiPrincess();
      setGameState(prev => ({ ...prev, princessImageUrl: url }));
    };
    initPrincess();
    
    const saved = localStorage.getItem('lab_leaderboard');
    if (saved) setLeaderboard(JSON.parse(saved));
  }, []);

  // AUTOMATIC SCORE RECORDING - Single Source of Truth
  const recordFinalScore = useCallback(() => {
    if (!playerName || gameState.score === 0) return;
    
    const newEntry: LeaderboardEntry = { 
      name: playerName.trim().toUpperCase(), 
      score: gameState.score, 
      level: gameState.level 
    };
    
    const saved = localStorage.getItem('lab_leaderboard');
    const currentLeaderboard: LeaderboardEntry[] = saved ? JSON.parse(saved) : [];
    
    // Sort and limit to top 5
    const updated = [...currentLeaderboard, newEntry]
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
      
    setLeaderboard(updated);
    localStorage.setItem('lab_leaderboard', JSON.stringify(updated));
  }, [playerName, gameState.score, gameState.level]);

  // Trigger auto-save whenever game ends
  useEffect(() => {
    if (gameState.isGameOver) {
      recordFinalScore();
    }
  }, [gameState.isGameOver, recordFinalScore]);

  // Stability decay
  useEffect(() => {
    if (!isGameStarted || gameState.isGameOver || activeQuestion || gameState.isWordChallengeMode) return;
    
    const decayInterval = Math.max(120, 400 - (gameState.level * 30)); 
    const timer = setInterval(() => {
      setGameState(prev => {
        const nextStability = Math.max(0, prev.stability - 1);
        if (nextStability <= 0) {
          soundService.playExplosion();
          return { ...prev, isGameOver: true, isExploding: true };
        }
        return { ...prev, stability: nextStability };
      });
    }, decayInterval);

    return () => clearInterval(timer);
  }, [isGameStarted, gameState.isGameOver, activeQuestion, gameState.isWordChallengeMode, gameState.level]);

  // Randomized Timing for Challenges
  useEffect(() => {
    if (!isGameStarted || gameState.isGameOver || activeQuestion || gameState.isWordChallengeMode) return;
    
    const triggerRandomQuiz = async () => {
      const delay = Math.random() * (45000 - 20000) + 20000;
      await new Promise(r => setTimeout(r, delay));
      if (isGameStarted && !gameState.isGameOver && !gameState.isWordChallengeMode) {
        setIsLoading(true);
        const topics = Object.values(ChallengeTopic);
        const q = await generatePhysicsQuestion(topics[Math.floor(Math.random() * topics.length)]);
        setActiveQuestion(q);
        setIsLoading(false);
      }
    };
    triggerRandomQuiz();
  }, [isGameStarted, activeQuestion, gameState.isWordChallengeMode, gameState.isGameOver]);

  const handleMatch = useCallback((matches: { type: TileType; count: number }[], clearedObstacles: boolean) => {
    if (gameState.isGameOver) return;
    
    let targetHits = 0;
    matches.forEach(m => {
      if (m.type === gameState.currentTargetType) targetHits += 1;
    });

    setGameState(prev => ({
      ...prev,
      score: prev.score + (matches.length * 25) + (clearedObstacles ? 500 : 0),
      stability: Math.min(100, prev.stability + (matches.length * 2) + (clearedObstacles ? 20 : 0)),
      collectedTargetCount: prev.collectedTargetCount + targetHits
    }));
  }, [gameState.isGameOver, gameState.currentTargetType]);

  const handleTargetCompletion = useCallback(async () => {
    setIsLoading(true);
    const challenge = await generateWordChallenge();
    setActiveWordChallenge(challenge);
    setGameState(prev => ({ ...prev, isWordChallengeMode: true }));
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (gameState.collectedTargetCount >= gameState.requiredTargetCount && !gameState.isWordChallengeMode) {
      handleTargetCompletion();
    }
  }, [gameState.collectedTargetCount, gameState.requiredTargetCount, gameState.isWordChallengeMode, handleTargetCompletion]);

  const handleQuestionResult = (isCorrect: boolean) => {
    if (isCorrect) {
      setGameState(prev => ({ ...prev, score: prev.score + 500, stability: Math.min(100, prev.stability + 30) }));
    } else {
      setGameState(prev => {
        const nextStability = Math.max(0, prev.stability - 25);
        if (nextStability <= 0) {
          soundService.playExplosion();
          return { ...prev, score: Math.max(0, prev.score - 200), stability: 0, isGameOver: true, isExploding: true };
        }
        return { ...prev, score: Math.max(0, prev.score - 200), stability: nextStability };
      });
    }
    setActiveQuestion(null);
  };

  const handleWordChallengeResult = (isCorrect: boolean) => {
    if (isCorrect) {
      const types = [TileType.GRAVITY, TileType.FORCE, TileType.MASS, TileType.VELOCITY, TileType.ACCELERATION];
      const nextLevel = gameState.level + 1;
      setGameState(prev => ({
        ...prev,
        score: prev.score + 5000,
        stability: 100,
        level: nextLevel,
        collectedTargetCount: 0,
        requiredTargetCount: INITIAL_REQUIRED_TARGET + (nextLevel * 4),
        currentTargetType: types[nextLevel % types.length],
        isWordChallengeMode: false
      }));
    }
    setActiveWordChallenge(null);
  };

  const handleStartGame = (e: React.FormEvent) => {
    e.preventDefault();
    if (playerName.trim().length > 0) {
      setIsGameStarted(true);
    }
  };

  const handleTryAgain = () => {
    setGameState({
      score: 0,
      stability: 100,
      level: 1,
      topic: ChallengeTopic.GENERAL_KNOWLEDGE,
      isGameOver: false,
      collectedTargetCount: 0,
      requiredTargetCount: INITIAL_REQUIRED_TARGET,
      currentTargetType: TileType.GRAVITY,
      isExploding: false,
      princessImageUrl: gameState.princessImageUrl,
      isWordChallengeMode: false
    });
  };

  const handleEndGame = () => {
    setIsGameStarted(false);
    setPlayerName('');
    handleTryAgain();
  };

  const currentTargetInfo = TILE_DATA[gameState.currentTargetType];

  // START SCREEN
  if (!isGameStarted) {
    return (
      <div className="min-h-screen bg-[#fffafa] text-gray-800 p-6 flex flex-col items-center justify-center select-none font-sans overflow-hidden">
        <div className="fixed inset-0 pointer-events-none -z-10 opacity-40">
          <div className="absolute top-[-10%] left-[-10%] w-[80%] h-[80%] bg-pink-100 blur-[200px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] bg-blue-100 blur-[200px] rounded-full" />
        </div>

        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-md bg-white/90 backdrop-blur-2xl rounded-[4rem] p-10 clay-card border-b-[16px] border-pink-100 text-center relative overflow-hidden"
        >
          <div className="flex justify-center mb-8">
            <div className="clay-tile w-24 h-24 bg-white flex items-center justify-center border-4 border-pink-100 shadow-xl">
              <Crown className="w-14 h-14 text-pink-500 fill-pink-500/10" />
            </div>
          </div>
          
          <h1 className="text-5xl font-black text-pink-600 tracking-tight leading-none uppercase italic mb-4">PhyZzle Pro</h1>
          <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.3em] mb-10">Laboratory Entrance</p>

          <form onSubmit={handleStartGame} className="space-y-6">
            <div className="relative group">
              <User className="absolute left-6 top-1/2 -translate-y-1/2 text-pink-300 w-6 h-6 transition-colors group-focus-within:text-pink-500" />
              <input 
                type="text"
                placeholder="RESEARCHER NAME"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value.toUpperCase())}
                className="w-full py-6 pl-16 pr-8 rounded-3xl bg-gray-50 border-4 border-gray-100 text-xl font-black text-gray-800 uppercase focus:outline-none focus:border-pink-500 transition-all shadow-inner"
                required
                maxLength={15}
              />
            </div>
            
            <button 
              type="submit"
              className="w-full bg-pink-500 hover:bg-pink-600 text-white py-6 rounded-3xl font-black text-2xl shadow-xl shadow-pink-200 flex items-center justify-center gap-3 transition-all active:scale-95 group"
            >
              <Play className="fill-white group-hover:scale-110 transition-transform" />
              START LAB
            </button>
          </form>
        </motion.div>

        <div className="w-full max-w-md mt-10 bg-white/60 backdrop-blur-md p-8 rounded-[3rem] clay-card border border-white/40">
           <div className="flex items-center gap-3 mb-6 justify-center">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <h3 className="text-sm font-black text-gray-600 uppercase tracking-widest">Global Hall of Fame</h3>
           </div>
           <div className="space-y-2">
             {leaderboard.length === 0 ? (
               <p className="text-center text-gray-300 font-bold uppercase text-[8px] tracking-widest py-4">No data recorded yet</p>
             ) : (
               leaderboard.map((entry, i) => (
                 <motion.div 
                    initial={{ x: -10, opacity: 0 }} 
                    animate={{ x: 0, opacity: 1 }} 
                    transition={{ delay: i * 0.1 }}
                    key={i} 
                    className="flex items-center justify-between px-5 py-3 rounded-2xl bg-white/50 border border-white shadow-sm"
                  >
                   <div className="flex items-center gap-3">
                     <span className="text-[10px] font-black text-pink-300">#{i+1}</span>
                     <span className="font-black text-gray-700 text-xs">{entry.name}</span>
                   </div>
                   <span className="font-black text-pink-600 text-xs">{entry.score.toLocaleString()}</span>
                 </motion.div>
               ))
             )}
           </div>
        </div>
      </div>
    );
  }

  // MAIN GAME SCREEN
  return (
    <div className="min-h-screen bg-[#fffafa] text-gray-800 p-4 sm:p-6 flex flex-col items-center select-none font-sans overflow-hidden">
      <div className="fixed inset-0 pointer-events-none -z-10 opacity-40">
        <div className="absolute top-[-10%] left-[-10%] w-[80%] h-[80%] bg-pink-100 blur-[200px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] bg-blue-100 blur-[200px] rounded-full" />
      </div>

      <header className="w-full max-w-2xl flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="clay-tile w-14 h-14 bg-white flex items-center justify-center border-2 border-pink-100 shadow-md">
            <Crown className="w-8 h-8 text-pink-500 fill-pink-500/10" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-pink-600 tracking-tight leading-none uppercase italic">PhyZzle Pro</h1>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Lab Score</span>
          <span className="text-2xl font-black text-pink-600">{gameState.score.toLocaleString()}</span>
        </div>
      </header>

      <div className="w-full max-w-2xl bg-white/90 backdrop-blur-2xl rounded-[3rem] p-6 mb-6 clay-card border-b-[8px] border-pink-100 flex flex-col sm:flex-row items-center justify-between gap-6">
         <div className="flex items-center gap-5">
            <motion.div 
              key={gameState.currentTargetType}
              initial={{ scale: 0, rotate: -45 }} animate={{ scale: 1, rotate: 0 }}
              className={`w-20 h-20 rounded-3xl clay-tile ${currentTargetInfo.color} flex items-center justify-center border-4 border-white shadow-xl`}
            >
               <div className="scale-125">{currentTargetInfo.icon}</div>
            </motion.div>
            <div>
               <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Current Mission</p>
               <h2 className="text-xl font-black text-gray-800">Collect {gameState.requiredTargetCount} Units</h2>
               <p className="text-[9px] text-orange-400 font-bold uppercase tracking-widest mt-1">Match 5 to Zap Obstacles!</p>
            </div>
         </div>
         <div className="flex items-center gap-6 bg-pink-50/50 p-4 rounded-3xl border border-pink-100">
            <div className="text-right">
               <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Progress</p>
               <div className="flex items-baseline gap-1">
                 <span className="text-4xl font-black text-pink-600 leading-none">{gameState.collectedTargetCount}</span>
                 <span className="text-lg font-black text-pink-300">/ {gameState.requiredTargetCount}</span>
               </div>
            </div>
            <div className="w-16 h-16 relative">
              <svg className="w-full h-full -rotate-90">
                <circle cx="32" cy="32" r="28" fill="none" stroke="#fee2e2" strokeWidth="6" />
                <motion.circle 
                  cx="32" cy="32" r="28" fill="none" stroke="#db2777" strokeWidth="6" 
                  strokeDasharray="176"
                  animate={{ strokeDashoffset: 176 - (176 * Math.min(1, gameState.collectedTargetCount / gameState.requiredTargetCount)) }}
                  transition={{ type: "spring", stiffness: 50 }}
                />
              </svg>
              <Target className="absolute inset-0 m-auto w-5 h-5 text-pink-400 animate-pulse" />
            </div>
         </div>
      </div>

      <main className="w-full max-w-2xl flex flex-col items-center gap-6">
        <PhysicsLab
          stability={gameState.stability}
          level={gameState.level}
          isExploding={gameState.isExploding}
          imageUrl={gameState.princessImageUrl}
        />

        <div className="relative w-full">
          <Match3Grid onMatch={handleMatch} level={gameState.level} />
          
          <AnimatePresence>
            {isLoading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-md rounded-[3.5rem] z-20">
                <div className="flex flex-col items-center">
                   <Loader2 className="w-12 h-12 text-pink-500 animate-spin mb-4" />
                   <p className="font-black text-pink-500 text-xs uppercase tracking-[0.4em]">Processing Laboratory Data...</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <AnimatePresence>
        {activeQuestion && (
          <QuestionModal
            question={activeQuestion}
            difficulty={Difficulty.MEDIUM}
            onAnswer={handleQuestionResult}
            onClose={() => setActiveQuestion(null)}
          />
        )}

        {activeWordChallenge && (
          <WordChallengeModal
            challenge={activeWordChallenge}
            onComplete={handleWordChallengeResult}
          />
        )}

        {gameState.isGameOver && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-red-950/95 backdrop-blur-3xl">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0, y: 50 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              className="bg-white p-12 rounded-[4rem] text-center max-w-md w-full border-b-[16px] border-red-500 shadow-[0_32px_64px_rgba(239,68,68,0.3)]"
            >
              <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Bomb className="w-12 h-12 text-red-500" />
              </div>
              <h2 className="text-4xl font-black text-red-600 mb-2 uppercase tracking-tight">Core Breach</h2>
              <p className="text-gray-400 font-bold mb-8 italic">System offline at Level {gameState.level}</p>
              
              <div className="clay-card p-8 mb-8 bg-red-50 border-2 border-red-100 shadow-inner">
                <p className="text-[10px] text-red-400 uppercase font-black tracking-widest mb-2">Final Score Auto-Recorded</p>
                <p className="text-6xl font-black text-red-600">{gameState.score.toLocaleString()}</p>
                <div className="flex items-center justify-center gap-2 mt-3">
                  <User className="w-3 h-3 text-gray-400" />
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{playerName}</p>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <button 
                  onClick={handleTryAgain} 
                  className="w-full bg-pink-500 hover:bg-pink-600 text-white py-5 rounded-3xl font-black text-xl shadow-lg shadow-pink-200 transition-all active:scale-95 flex items-center justify-center gap-3"
                >
                  <RotateCcw className="w-6 h-6" />
                  TRY AGAIN
                </button>
                <button 
                  onClick={handleEndGame} 
                  className="w-full bg-gray-800 hover:bg-black text-white py-5 rounded-3xl font-black text-xl shadow-lg shadow-gray-300 transition-all active:scale-95 flex items-center justify-center gap-3"
                >
                  <LogOut className="w-6 h-6" />
                  END GAME
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
