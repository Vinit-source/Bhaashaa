import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Sentence } from '../db';
import confetti from 'canvas-confetti';
import { useCurrentLanguagePair } from '../hooks/useCurrentLanguagePair';

interface Question {
  sentence: Sentence;
  options: Sentence[];
  correctIndex: number;
}

export default function Quiz() {
  const pair = useCurrentLanguagePair();
  const allSentences = useLiveQuery(() => 
    pair ? db.sentences.filter(s => s.languagePairId === pair.id).toArray() : []
  , [pair?.id]) || [];

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  useEffect(() => {
    if (allSentences.length >= 4 && questions.length === 0) {
      // Generate 10 questions or less
      const numQuestions = Math.min(10, allSentences.length);
      const shuffled = [...allSentences].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, numQuestions);

      const generatedQuestions = selected.map(sentence => {
        // Pick 3 random wrong options
        const otherOptions = allSentences
          .filter(s => s.id !== sentence.id)
          .sort(() => 0.5 - Math.random())
          .slice(0, 3);
        
        const allOptions = [...otherOptions, sentence].sort(() => 0.5 - Math.random());
        const correctIndex = allOptions.findIndex(o => o.id === sentence.id);

        return {
          sentence,
          options: allOptions,
          correctIndex
        };
      });

      setQuestions(generatedQuestions);
    }
  }, [allSentences, questions.length]);

  if (!pair) return null;

  if (allSentences.length < 4) {
    return (
      <div className="text-center py-12 text-gray-500">
        You need at least 4 sentences in your vocabulary to take a quiz.
      </div>
    );
  }

  if (questions.length === 0) {
    return <div className="text-center py-12">Loading quiz...</div>;
  }

  const handleOptionClick = (index: number) => {
    if (selectedOption !== null) return; // Prevent multiple clicks
    setSelectedOption(index);
    
    const isCorrect = index === questions[currentQuestionIdx].correctIndex;
    if (isCorrect) {
      setScore(s => s + 1);
    }

    setTimeout(() => {
      if (currentQuestionIdx + 1 < questions.length) {
        setCurrentQuestionIdx(idx => idx + 1);
        setSelectedOption(null);
      } else {
        finishQuiz(score + (isCorrect ? 1 : 0));
      }
    }, 1500);
  };

  const finishQuiz = async (finalScore: number) => {
    setIsFinished(true);
    await db.quizStats.add({
      date: new Date(),
      score: finalScore,
      total: questions.length,
      languagePairId: pair.id
    });
    
    if (finalScore / questions.length > 0.7) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  };

  if (isFinished) {
    return (
      <div className="max-w-lg mx-auto bg-white rounded-3xl shadow-sm border border-orange-100 p-10 text-center space-y-6 animate-in zoom-in-95 duration-500">
        <h2 className="text-3xl font-bold text-gray-900">Quiz Complete!</h2>
        <div className="text-6xl font-black text-orange-500">
          {score} / {questions.length}
        </div>
        <p className="text-gray-500 text-lg">
          {score === questions.length ? "Perfect score! Outstanding!" : "Keep practicing, you're doing great!"}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-4 rounded-xl transition-colors"
        >
          Try Another Quiz
        </button>
      </div>
    );
  }

  const currentQ = questions[currentQuestionIdx];

  if (!currentQ) {
    return <div className="text-center py-12">Loading question...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center text-gray-500 font-medium">
        <span>Question {currentQuestionIdx + 1} of {questions.length}</span>
        <span>Score: {score}</span>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-orange-100 p-8 text-center space-y-4">
        <h2 className="text-xl text-orange-600 font-semibold uppercase tracking-wider text-sm">Translate to {pair.targetLanguage}</h2>
        <p className="text-4xl font-bold text-gray-900">{pair.sourceLanguage2 ? currentQ.sentence.sourceText2 : currentQ.sentence.sourceText1}</p>
        {pair.sourceLanguage2 && <p className="text-lg text-gray-500">{currentQ.sentence.sourceText1}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {currentQ.options.map((option, idx) => {
          let stateClass = "bg-white border-gray-200 hover:border-orange-400 hover:bg-orange-50";
          if (selectedOption !== null) {
            if (idx === currentQ.correctIndex) {
              stateClass = "bg-green-100 border-green-500 text-green-800";
            } else if (idx === selectedOption) {
              stateClass = "bg-red-100 border-red-500 text-red-800";
            } else {
              stateClass = "bg-white border-gray-200 opacity-50";
            }
          }

          return (
            <button
              key={idx}
              onClick={() => handleOptionClick(idx)}
              disabled={selectedOption !== null}
              className={`p-4 sm:p-6 rounded-2xl border-2 text-center transition-all shadow-sm flex flex-col items-center justify-center space-y-1 sm:space-y-2 group ${stateClass}`}
            >
              <span className="text-xl font-bold">{option.targetText}</span>
              <span className="text-sm font-medium opacity-80">{option.transliteration}</span>
              {(option as any).nativeTransliteration && (option as any).nativeTransliteration.toLowerCase() !== option.transliteration.toLowerCase() && (
                <span className="text-xs font-medium opacity-60">{(option as any).nativeTransliteration}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
