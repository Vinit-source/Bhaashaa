import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Link } from 'react-router-dom';
import { BookOpen, BrainCircuit, Sparkles, Languages } from 'lucide-react';
import { useCurrentLanguagePair } from '../hooks/useCurrentLanguagePair';

export default function Dashboard() {
  const pair = useCurrentLanguagePair();
  const sentences = useLiveQuery(() => 
    pair ? db.sentences.filter(s => s.languagePairId === pair.id).toArray() : []
  , [pair?.id]) || [];
  
  const quizStats = useLiveQuery(() => 
    pair ? db.quizStats.filter(q => q.languagePairId === pair.id).reverse().toArray() : []
  , [pair?.id]) || [];

  const total = sentences.length;
  const learned = sentences.filter(s => s.learned).length;
  const percentage = total === 0 ? 0 : Math.round((learned / total) * 100);

  const averageQuizScore = quizStats.length > 0
    ? Math.round(quizStats.reduce((acc, q) => acc + (q.score / q.total), 0) / quizStats.length * 100)
    : 0;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Your Progress</h1>
        <p className="text-lg text-gray-600">Keep up the great work in learning {pair?.targetLanguage || 'your new language'}!</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-orange-100 flex flex-col items-center justify-center space-y-4">
          <h2 className="text-xl font-semibold text-gray-700">Vocabulary Mastered</h2>
          <div className="relative w-32 h-32 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-orange-100"
                strokeWidth="3"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-orange-500 transition-all duration-1000 ease-out"
                strokeWidth="3"
                strokeDasharray={`${percentage}, 100`}
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute text-3xl font-bold text-gray-800">{percentage}%</div>
          </div>
          <p className="text-gray-500">{learned} out of {total} sentences</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-orange-100 flex flex-col items-center justify-center space-y-4">
          <h2 className="text-xl font-semibold text-gray-700">Quiz Average</h2>
          <div className="text-6xl font-black text-red-500">
            {quizStats.length > 0 ? `${averageQuizScore}%` : '-'}
          </div>
          <p className="text-gray-500">{quizStats.length} quizzes taken</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/app/learn" className="group bg-white p-6 rounded-2xl shadow-sm border border-orange-100 hover:border-orange-300 hover:shadow-md transition-all flex flex-col items-center text-center space-y-3">
          <div className="p-4 bg-orange-100 text-orange-600 rounded-full group-hover:scale-110 transition-transform">
            <BookOpen size={24} />
          </div>
          <h3 className="font-semibold text-lg text-gray-800">Learn</h3>
          <p className="text-sm text-gray-500">Review your flashcards.</p>
        </Link>
        <Link to="/app/quiz" className="group bg-white p-6 rounded-2xl shadow-sm border border-orange-100 hover:border-red-300 hover:shadow-md transition-all flex flex-col items-center text-center space-y-3">
          <div className="p-4 bg-red-100 text-red-600 rounded-full group-hover:scale-110 transition-transform">
            <BrainCircuit size={24} />
          </div>
          <h3 className="font-semibold text-lg text-gray-800">Quiz</h3>
          <p className="text-sm text-gray-500">Test your knowledge.</p>
        </Link>
        <Link to="/app/translate" className="group bg-white p-6 rounded-2xl shadow-sm border border-orange-100 hover:border-blue-300 hover:shadow-md transition-all flex flex-col items-center text-center space-y-3">
          <div className="p-4 bg-blue-100 text-blue-600 rounded-full group-hover:scale-110 transition-transform">
            <Languages size={24} />
          </div>
          <h3 className="font-semibold text-lg text-gray-800">Translate</h3>
          <p className="text-sm text-gray-500">Translate and add sentences.</p>
        </Link>
        <Link to="/app/generate" className="group bg-white p-6 rounded-2xl shadow-sm border border-orange-100 hover:border-yellow-300 hover:shadow-md transition-all flex flex-col items-center text-center space-y-3">
          <div className="p-4 bg-yellow-100 text-yellow-600 rounded-full group-hover:scale-110 transition-transform">
            <Sparkles size={24} />
          </div>
          <h3 className="font-semibold text-lg text-gray-800">Generate</h3>
          <p className="text-sm text-gray-500">AI custom sentences.</p>
        </Link>
      </div>
    </div>
  );
}
