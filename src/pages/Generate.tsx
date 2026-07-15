import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { db, Sentence } from '../db';
import { Loader2, KeyRound, Sparkles } from 'lucide-react';
import { generateSentences } from '../services/gemini';
import { useCurrentLanguagePair } from '../hooks/useCurrentLanguagePair';

export default function Generate() {
  const pair = useCurrentLanguagePair();
  const location = useLocation();
  const [apiKey, setApiKey] = useState('');
  const [count, setCount] = useState(location.state?.defaultCount || 20);
  const [topics, setTopics] = useState('Everyday conversation, shopping, asking directions');
  const [difficulty, setDifficulty] = useState('easy');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Load API key from local storage on mount
  useEffect(() => {
    const stored = localStorage.getItem('GEMINI_API_KEY_HINDI');
    if (stored) setApiKey(stored);
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pair) return;
    
    setLoading(true);
    setError('');
    setSuccessMsg('');

    if (apiKey) {
      localStorage.setItem('GEMINI_API_KEY_HINDI', apiKey);
    } else {
      setError('Please provide a valid Gemini API key.');
      setLoading(false);
      return;
    }

    try {
      const generatedData = await generateSentences(apiKey, count, topics, difficulty, pair);

      if (generatedData && Array.isArray(generatedData)) {
        const existing = await db.sentences.filter(s => s.languagePairId === pair.id).toArray();
        const existingHindi = new Set(existing.map(s => s.targetText));
        
        const sentencesToSave: Omit<Sentence, 'id'>[] = generatedData
          .filter((s: any) => !existingHindi.has(s.targetText))
          .map((s: any) => ({
            ...s,
            learned: false,
            reviewCount: 0,
            languagePairId: pair.id
          }));

        if (sentencesToSave.length > 0) {
          await db.sentences.bulkAdd(sentencesToSave);
          setSuccessMsg(`Successfully generated and saved ${sentencesToSave.length} new sentences! (${generatedData.length - sentencesToSave.length} duplicates skipped)`);
        } else {
          setSuccessMsg(`Generated ${generatedData.length} sentences, but all were already in your vocabulary.`);
        }
      } else {
        throw new Error('Invalid response format from AI');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during generation.');
    } finally {
      setLoading(false);
    }
  };

  if (!pair) return null;

  return (
    <div className="max-w-xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Generate Sentences</h1>
        <p className="text-gray-500">Use AI to create custom {pair.targetLanguage} sentences tailored to your needs.</p>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-orange-100">
        <form onSubmit={handleGenerate} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
              <KeyRound size={16} className="text-orange-500" />
              Gemini API Key
            </label>
            <p className="text-xs text-gray-500">
              A Gemini API Key is required to run AI that will generate the new sentences and their meanings. 
              Get your free key from <a href="https://aistudio.google.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:underline">Google AI Studio</a>.
            </p>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIza..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
            />
            <p className="text-xs text-gray-400">Stored locally in your browser.</p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Number of Sentences</label>
            <input
              type="number"
              min="1"
              max="100"
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value))}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Topics / Context</label>
            <textarea
              value={topics}
              onChange={(e) => setTopics(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all resize-none"
              placeholder="e.g. going to the market, talking to a doctor..."
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Difficulty</label>
            <div className="grid grid-cols-3 gap-2">
              {(['easy', 'medium', 'hard'] as const).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setDifficulty(level)}
                  className={`py-2 rounded-xl text-sm font-semibold capitalize border transition-all ${
                    difficulty === level 
                      ? 'bg-orange-100 border-orange-500 text-orange-700' 
                      : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {difficulty === 'easy' && 'Short phrases, minimum 3 words.'}
              {difficulty === 'medium' && 'Standard sentences, minimum 5 words.'}
              {difficulty === 'hard' && 'Comprehensive conversations.'}
            </p>
          </div>

          {error && (
            <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm border border-red-100">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="p-4 bg-green-50 text-green-700 rounded-xl text-sm border border-green-100">
              {successMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Sparkles size={20} />
                <span>Generate New Sentences</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
