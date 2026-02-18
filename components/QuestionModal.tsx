
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PhysicsQuestion, Difficulty } from '../types';
import { CheckCircle2, XCircle, AlertCircle, Brain } from 'lucide-react';
import { soundService } from '../services/soundService';

interface QuestionModalProps {
  question: PhysicsQuestion;
  difficulty: Difficulty;
  onAnswer: (isCorrect: boolean) => void;
  onClose: () => void;
}

const QuestionModal: React.FC<QuestionModalProps> = ({ question, difficulty, onAnswer, onClose }) => {
  const [selected, setSelected] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const initialTime = 10; // Hardcoded to 10s
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [status, setStatus] = useState<'thinking' | 'correct' | 'wrong' | 'timeout'>('thinking');

  useEffect(() => {
    if (isSubmitted) return;
    if (timeLeft <= 0) {
      handleTimeout();
      return;
    }
    const timer = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, isSubmitted]);

  const handleTimeout = () => {
    setIsSubmitted(true);
    setStatus('timeout');
    soundService.playWrong();
  };

  const handleSubmit = (idx: number) => {
    if (isSubmitted) return;
    setSelected(idx);
    setIsSubmitted(true);
    if (idx === question.correctIndex) {
      setStatus('correct');
      soundService.playCorrect();
    } else {
      setStatus('wrong');
      soundService.playWrong();
    }
  };

  const handleFinish = () => {
    onAnswer(status === 'correct');
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-gray-950/90 backdrop-blur-2xl">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        className="bg-white rounded-[3rem] w-full max-w-lg overflow-hidden shadow-2xl border-t-[12px] border-pink-500"
      >
        {!isSubmitted && (
          <div className="h-3 w-full bg-gray-100 overflow-hidden">
            <motion.div 
              initial={{ width: "100%" }} 
              animate={{ width: `${(timeLeft / initialTime) * 100}%` }} 
              transition={{ duration: 1, ease: "linear" }} 
              className={`h-full ${timeLeft > 3 ? 'bg-pink-500' : 'bg-red-500 animate-pulse'}`} 
            />
          </div>
        )}

        <div className="p-8 sm:p-12">
          <div className="flex justify-between items-start mb-8 gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <Brain className="w-5 h-5 text-pink-400" />
                <span className="bg-pink-50 text-pink-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-pink-100">
                  Quick Quiz
                </span>
              </div>
              <h3 className="text-2xl font-black text-gray-800 leading-snug">
                {question.question}
              </h3>
            </div>
            {!isSubmitted && (
              <div className="flex flex-col items-center">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border-4 ${timeLeft > 3 ? 'border-pink-500 text-pink-500' : 'border-red-500 text-red-600 animate-pulse'}`}>
                  <span className="text-2xl font-black">{timeLeft}</span>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3">
            {question.options.map((option, idx) => {
              let style = 'bg-gray-50 border-gray-100 hover:border-pink-300 text-gray-700';
              let icon = null;

              if (isSubmitted) {
                if (idx === question.correctIndex) {
                  style = 'bg-green-50 border-green-500 text-green-700';
                  icon = <CheckCircle2 className="w-6 h-6 text-green-600" />;
                } else if (idx === selected) {
                  style = 'bg-red-50 border-red-300 text-red-700';
                  icon = <XCircle className="w-6 h-6 text-red-500" />;
                } else {
                  style = 'bg-gray-50 border-gray-100 text-gray-300';
                }
              }

              return (
                <button
                  key={idx}
                  disabled={isSubmitted}
                  onClick={() => handleSubmit(idx)}
                  className={`w-full p-5 rounded-3xl border-2 text-left transition-all flex justify-between items-center font-bold text-base ${style}`}
                >
                  <span className="flex-1 pr-4">{option}</span>
                  {icon}
                </button>
              );
            })}
          </div>

          <AnimatePresence>
            {isSubmitted && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8">
                <div className={`p-5 rounded-3xl flex items-start gap-4 border-2 ${status === 'correct' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                   <p className="text-sm font-bold text-gray-600 leading-relaxed italic">
                      {question.explanation}
                   </p>
                </div>

                <button
                  onClick={handleFinish}
                  className="w-full bg-pink-600 hover:bg-pink-700 text-white py-5 rounded-3xl font-black text-xl shadow-xl mt-6 transition-all"
                >
                  CONTINUE
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default QuestionModal;
