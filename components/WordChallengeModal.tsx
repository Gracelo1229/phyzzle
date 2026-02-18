
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WordChallenge } from '../types';
import { Sparkles, Send } from 'lucide-react';
import { soundService } from '../services/soundService';

interface WordChallengeModalProps {
  challenge: WordChallenge;
  onComplete: (isCorrect: boolean) => void;
}

const WordChallengeModal: React.FC<WordChallengeModalProps> = ({ challenge, onComplete }) => {
  const [guess, setGuess] = useState('');
  const [isWrong, setIsWrong] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (guess.toUpperCase().trim() === challenge.word.toUpperCase()) {
      soundService.playCorrect();
      onComplete(true);
    } else {
      soundService.playWrong();
      setIsWrong(true);
      setTimeout(() => setIsWrong(false), 500);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-pink-950/90 backdrop-blur-3xl">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        className="bg-white rounded-[4rem] w-full max-w-lg p-10 text-center shadow-[0_32px_64px_rgba(219,39,119,0.3)] border-b-[16px] border-pink-500"
      >
        <div className="w-20 h-20 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <Sparkles className="w-10 h-10 text-pink-500 animate-pulse" />
        </div>
        <h2 className="text-3xl font-black text-gray-800 mb-2 uppercase tracking-tight">Level Up Challenge</h2>
        <p className="text-gray-400 font-bold mb-8 uppercase text-[10px] tracking-widest">Guess the English word to advance</p>
        
        <div className="bg-gray-50 p-8 rounded-[2.5rem] mb-8 border-2 border-gray-100">
          <p className="text-[9px] font-black text-pink-400 uppercase tracking-widest mb-2">Hint</p>
          <p className="text-lg font-black text-gray-700 leading-tight mb-6">"{challenge.hint}"</p>
          
          <div className="flex gap-2 justify-center mb-4">
             {challenge.scrambled.split('').map((char, i) => (
               <div key={i} className="w-10 h-12 bg-white rounded-xl border-2 border-gray-200 flex items-center justify-center font-black text-pink-500 text-xl shadow-inner">
                 {char}
               </div>
             ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="relative">
          <motion.input 
            animate={isWrong ? { x: [-10, 10, -10, 10, 0] } : {}}
            type="text"
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            placeholder="Type your guess..."
            autoFocus
            className={`w-full py-6 px-8 rounded-3xl bg-gray-50 border-4 ${isWrong ? 'border-red-400' : 'border-gray-100'} text-2xl font-black text-center text-gray-800 uppercase focus:outline-none focus:border-pink-500 transition-all`}
          />
          <button 
            type="submit"
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-pink-500 rounded-2xl flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all"
          >
            <Send className="w-6 h-6 text-white" />
          </button>
        </form>
        
        <p className="mt-6 text-[10px] font-bold text-gray-400 uppercase">Correct spelling is required!</p>
      </motion.div>
    </div>
  );
};

export default WordChallengeModal;
