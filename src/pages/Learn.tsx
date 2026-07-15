import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Sentence, LanguagePair } from '../db';
import { useCurrentLanguagePair } from '../hooks/useCurrentLanguagePair';
import { Volume2, ChevronRight, ChevronLeft, Check, RefreshCw } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function LearnedModal({ learnedSentences, onClose, pair }: { learnedSentences: Sentence[], onClose: () => void, pair: LanguagePair | undefined }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden text-left">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h2 className="text-xl font-bold text-gray-800">Mastered Words ({learnedSentences.length})</h2>
          <button onClick={onClose} className="p-2 text-gray-500 hover:bg-gray-200 rounded-full transition-colors">
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {learnedSentences.map(s => (
            <div key={s.id} className="p-4 bg-orange-50 border border-orange-100 rounded-2xl flex flex-col gap-2">
              <div className="flex justify-between items-start">
                <h3 className="text-xl font-bold text-gray-900">{s.targetText}</h3>
                <span className="text-sm font-medium text-orange-600 bg-orange-100 px-2 py-1 rounded">Mastered</span>
              </div>
              <p className="text-gray-600 font-medium">{s.transliteration}</p>
              <div className="grid grid-cols-2 gap-4 text-sm mt-2">
                {pair?.sourceLanguage2 && (
                  <div>
                    <span className="block text-gray-400 font-semibold uppercase tracking-wider text-xs">{pair.sourceLanguage2}</span>
                    <span className="text-gray-800">{s.sourceText2}</span>
                  </div>
                )}
                <div>
                  <span className="block text-gray-400 font-semibold uppercase tracking-wider text-xs">{pair?.sourceLanguage1 || 'Source'}</span>
                  <span className="text-gray-800">{s.sourceText1}</span>
                </div>
              </div>
            </div>
          ))}
          {learnedSentences.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              You haven't mastered any words yet. Keep practicing!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Learn() {
  const pair = useCurrentLanguagePair();
  const allSentences = useLiveQuery(() => 
    pair ? db.sentences.filter(s => s.languagePairId === pair.id).toArray() : []
  , [pair?.id]) || [];

  const unlearnedSentences = allSentences.filter(s => !s.learned);
  const learnedSentences = allSentences.filter(s => s.learned);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showLearnedModal, setShowLearnedModal] = useState(false);

  // Simple shuffle on mount
  const [sentences, setSentences] = useState<Sentence[]>([]);

  useEffect(() => {
    if (unlearnedSentences.length > 0 && sentences.length === 0) {
      // Sort by least reviewed first, then random
      const sorted = [...unlearnedSentences].sort((a, b) => {
        if (a.reviewCount !== b.reviewCount) return a.reviewCount - b.reviewCount;
        return Math.random() - 0.5;
      });
      setSentences(sorted);
    } else if (unlearnedSentences.length !== sentences.length) {
      // Re-sync if length changes (e.g. word was learned)
      const sorted = [...unlearnedSentences].sort((a, b) => {
        if (a.reviewCount !== b.reviewCount) return a.reviewCount - b.reviewCount;
        return Math.random() - 0.5;
      });
      setSentences(sorted);
      if (currentIndex >= sorted.length) {
        setCurrentIndex(Math.max(0, sorted.length - 1));
      }
    }
  }, [allSentences.length, unlearnedSentences.length, pair?.id]);

  if (!sentences || sentences.length === 0) {
    return (
      <div className="text-center py-12 space-y-4">
        <h2 className="text-2xl font-bold text-gray-800">You've mastered all current words!</h2>
        <p className="text-gray-500">Generate more sentences to continue learning.</p>
        <button 
          onClick={() => setShowLearnedModal(true)}
          className="px-6 py-2 bg-orange-100 text-orange-700 font-semibold rounded-lg hover:bg-orange-200"
        >
          View {learnedSentences.length} Learned Words
        </button>
        
        {showLearnedModal && (
          <LearnedModal 
            learnedSentences={learnedSentences} 
            onClose={() => setShowLearnedModal(false)}
            pair={pair}
          />
        )}
      </div>
    );
  }

  const currentSentence = sentences[currentIndex];

  if (!currentSentence) {
    return (
      <div className="text-center py-12 space-y-4">
        <h2 className="text-2xl font-bold text-gray-800">Loading your learning session...</h2>
      </div>
    );
  }

  const playAudio = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const utterance = new SpeechSynthesisUtterance(currentSentence.targetText);
    // Rough heuristic for language code
    if (pair?.targetLanguage.toLowerCase() === 'hindi') utterance.lang = 'hi-IN';
    else if (pair?.targetLanguage.toLowerCase() === 'telugu') utterance.lang = 'te-IN';
    else if (pair?.targetLanguage.toLowerCase() === 'kannada') utterance.lang = 'kn-IN';
    else if (pair?.targetLanguage.toLowerCase() === 'tamil') utterance.lang = 'ta-IN';
    
    window.speechSynthesis.speak(utterance);
  };

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % sentences.length);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + sentences.length) % sentences.length);
  };

  const markLearned = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (currentSentence.id) {
      await db.sentences.update(currentSentence.id, {
        learned: true,
        reviewCount: currentSentence.reviewCount + 1
      });
      handleNext();
    }
  };

  const markReview = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (currentSentence.id) {
      await db.sentences.update(currentSentence.id, {
        reviewCount: currentSentence.reviewCount + 1
      });
      handleNext();
    }
  };

  return (
    <div className="max-w-[706px] mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-800">Flashcards</h1>
        <button 
          onClick={() => setShowLearnedModal(true)}
          className="px-4 py-2 bg-white text-orange-600 font-medium rounded-lg hover:bg-orange-50 border border-orange-200 transition-colors shadow-sm"
        >
          Learned Words ({learnedSentences.length})
        </button>
      </div>

      <div 
        className="relative h-[514px] w-full [perspective:1000px] cursor-pointer group"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div className={cn(
          "w-full h-full transition-all duration-500 [transform-style:preserve-3d] relative shadow-lg rounded-3xl",
          isFlipped ? "[transform:rotateY(180deg)]" : ""
        )}>
          {/* Front of card (Target language) */}
          <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] bg-white border-2 border-orange-200 rounded-3xl flex flex-col items-center text-center overflow-hidden">
            <button 
              onClick={(e) => { e.stopPropagation(); playAudio(e); }}
              className="absolute top-6 right-6 p-3 text-orange-500 bg-orange-50 rounded-full hover:bg-orange-100 hover:scale-110 transition-all focus:outline-none z-10"
            >
              <Volume2 size={24} />
            </button>
            <div className="flex-1 w-full flex flex-col items-center justify-center px-12 pt-24 pb-12 overflow-y-auto hide-scrollbar space-y-4">
              <h2 className="text-5xl font-black text-gray-900 leading-tight text-center">
                {currentSentence.targetText}
              </h2>
              <div className="flex flex-col items-center space-y-2">
                <p className="text-xl text-gray-500 font-medium tracking-wide text-center">
                  {currentSentence.transliteration}
                </p>
                {currentSentence.nativeTransliteration && currentSentence.nativeTransliteration.toLowerCase() !== currentSentence.transliteration.toLowerCase() && (
                  <p className="text-lg text-gray-400 font-medium tracking-wide text-center">
                    {currentSentence.nativeTransliteration}
                  </p>
                )}
              </div>
            </div>
            <div className="pb-6 text-sm text-gray-400 shrink-0">Click to flip</div>
          </div>

          {/* Back of card (Native language) */}
          <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] bg-gradient-to-br from-orange-500 to-red-500 rounded-3xl p-6 flex flex-col text-white shadow-inner overflow-hidden">
            <div className="flex-1 overflow-y-auto hide-scrollbar flex flex-col items-center pt-2 pb-4 space-y-4">
              
              {pair?.sourceLanguage2 && (
                <>
                  <div className="space-y-1 text-center">
                    <h3 className="text-xs font-semibold text-orange-200 uppercase tracking-widest">{pair.sourceLanguage2}</h3>
                    <h2 className="text-2xl font-bold leading-tight">
                      {currentSentence.sourceText2}
                    </h2>
                  </div>
                  <div className="w-12 h-px bg-white/30 rounded flex-shrink-0"></div>
                </>
              )}

              <div className="space-y-1 text-center">
                <h3 className="text-xs font-semibold text-orange-200 uppercase tracking-widest">{pair?.sourceLanguage1 || 'Source'}</h3>
                <h2 className="text-2xl font-bold leading-tight">
                  {currentSentence.sourceText1}
                </h2>
              </div>

              {currentSentence.wordMeanings && currentSentence.wordMeanings.length > 0 && (
                <>
                  <div className="w-12 h-px bg-white/30 rounded my-2 flex-shrink-0"></div>
                  <div className="w-full mt-2">
                    <h3 className="text-xs font-semibold text-orange-200 uppercase tracking-widest mb-3 text-center">Word by Word</h3>
                    <div className="grid grid-cols-1 gap-2 text-sm max-w-sm mx-auto">
                      {currentSentence.wordMeanings.map((wm, idx) => (
                        <div key={idx} className="flex flex-col bg-white/10 rounded-lg p-2 backdrop-blur-sm text-center">
                          <span className="font-bold text-orange-100">
                            {wm.targetText}
                            {wm.transliteration && ` - ${wm.transliteration}`}
                            {wm.nativeTransliteration && wm.nativeTransliteration.toLowerCase() !== wm.transliteration?.toLowerCase() && ` - ${wm.nativeTransliteration}`}
                          </span>
                          <span className="text-white/90">{pair?.sourceLanguage2 ? `${wm.sourceText2} / ${wm.sourceText1}` : wm.sourceText1}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
            
            <div className="w-full flex justify-between gap-4 pt-4 shrink-0">
              <button 
                onClick={(e) => { e.stopPropagation(); markReview(e); }}
                className="flex-1 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white py-3 rounded-xl font-medium flex items-center justify-center space-x-2 transition-all"
              >
                <RefreshCw size={18} />
                <span>Needs Review</span>
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); markLearned(e); }}
                className="flex-1 bg-white text-orange-600 hover:bg-orange-50 py-3 rounded-xl font-bold flex items-center justify-center space-x-2 shadow-lg transition-all"
              >
                <Check size={18} />
                <span>Got it!</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center px-4">
        <button 
          onClick={handlePrev}
          className="p-3 text-gray-500 bg-white rounded-full hover:bg-gray-100 shadow-sm border border-gray-200 transition-all"
        >
          <ChevronLeft size={24} />
        </button>
        <span className="text-gray-500 font-medium">
          {currentIndex + 1} / {sentences.length}
        </span>
        <button 
          onClick={handleNext}
          className="p-3 text-gray-500 bg-white rounded-full hover:bg-gray-100 shadow-sm border border-gray-200 transition-all"
        >
          <ChevronRight size={24} />
        </button>
      </div>
      
      {showLearnedModal && (
        <LearnedModal 
          learnedSentences={learnedSentences} 
          onClose={() => setShowLearnedModal(false)}
          pair={pair}
        />
      )}
    </div>
  );
}
