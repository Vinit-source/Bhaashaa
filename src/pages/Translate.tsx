import React, { useState, useEffect } from 'react';
import { db, Sentence } from '../db';
import { Loader2, KeyRound, Languages } from 'lucide-react';
import { translateText } from '../services/gemini';
import { useCurrentLanguagePair } from '../hooks/useCurrentLanguagePair';

export default function Translate() {
  const pair = useCurrentLanguagePair();
  const [apiKey, setApiKey] = useState('');
  const [text, setText] = useState('');
  
  // default to first source language
  const [sourceLang, setSourceLang] = useState<string>('');
  
  useEffect(() => {
    if (pair?.sourceLanguage1) {
      setSourceLang(pair.sourceLanguage1);
    }
  }, [pair]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<Omit<Sentence, 'id' | 'learned' | 'reviewCount' | 'languagePairId'> | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('GEMINI_API_KEY_HINDI');
    if (stored) setApiKey(stored);
  }, []);

  const handleTranslate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !pair) return;

    setLoading(true);
    setError('');
    setResult(null);
    setSaved(false);

    if (apiKey) {
      localStorage.setItem('GEMINI_API_KEY_HINDI', apiKey);
    } else {
      setError('Please provide a valid Gemini API key.');
      setLoading(false);
      return;
    }

    try {
      const translatedData = await translateText(apiKey, text, sourceLang, pair);

      if (translatedData) {
        setResult(translatedData);
      } else {
        throw new Error('Invalid response format from AI');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during translation.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!result || !pair) return;
    try {
      const existing = await db.sentences.filter(s => s.targetText === result.targetText && s.languagePairId === pair.id).first();
      if (existing) {
        setSaved(true);
        return; // Already exists
      }
      
      await db.sentences.add({
        ...result,
        learned: false,
        reviewCount: 0,
        languagePairId: pair.id
      });
      setSaved(true);
    } catch (e) {
      console.error(e);
    }
  };

  const [transLang, setTransLang] = useState<string>('');

  useEffect(() => {
    if (pair?.sourceLanguage1) {
      setTransLang(pair.sourceLanguage1);
    }
  }, [pair]);

  if (!pair) return null;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">AI Translator</h1>
        <p className="text-gray-500">Translate any {pair.sourceLanguage1}{pair.sourceLanguage2 ? ` or ${pair.sourceLanguage2}` : ''} sentence into {pair.targetLanguage} with word-by-word meaning.</p>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-orange-100 max-w-xl mx-auto space-y-2">
        <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
          <KeyRound size={16} className="text-orange-500" />
          Gemini API Key
        </label>
        <p className="text-xs text-gray-500 mb-2">
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-orange-100 flex flex-col h-full space-y-6">
          <form onSubmit={handleTranslate} className="flex flex-col h-full space-y-6">
            <div className="flex justify-between items-center">
              <label className="text-sm font-semibold text-gray-700">Source Text</label>
              <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => setSourceLang(pair.sourceLanguage1)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    sourceLang === pair.sourceLanguage1 ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {pair.sourceLanguage1}
                </button>
                {pair.sourceLanguage2 && (
                  <button
                    type="button"
                    onClick={() => setSourceLang(pair.sourceLanguage2!)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                      sourceLang === pair.sourceLanguage2 ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {pair.sourceLanguage2}
                  </button>
                )}
              </div>
            </div>

            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="flex-1 min-h-[150px] w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all resize-none text-lg"
              placeholder={`Enter ${sourceLang} text...`}
            />

            {error && (
              <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm border border-red-100">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !text.trim()}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-auto"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  <span>Translating...</span>
                </>
              ) : (
                <>
                  <Languages size={20} />
                  <span>Translate to {pair.targetLanguage}</span>
                </>
              )}
            </button>
          </form>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-orange-100 flex flex-col h-full min-h-[300px]">
          {!result ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
              <Languages size={48} className="mb-4 opacity-20" />
              <p>Translation will appear here</p>
            </div>
          ) : (
            <div className="space-y-6 flex flex-col h-full animate-in fade-in">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">{pair.targetLanguage}</h3>
                {pair.sourceLanguage2 && (
                  <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setTransLang(pair.sourceLanguage1)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                        transLang === pair.sourceLanguage1 ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {pair.sourceLanguage1}
                    </button>
                    <button
                      type="button"
                      onClick={() => setTransLang(pair.sourceLanguage2!)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                        transLang === pair.sourceLanguage2 ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {pair.sourceLanguage2}
                    </button>
                  </div>
                )}
              </div>

              <div>
                <p className="text-3xl font-black text-gray-900 mb-2">{result.targetText}</p>
                <p className="text-xl font-medium text-gray-500">
                  {transLang === pair.sourceLanguage2 && (result as any).nativeTransliteration 
                    ? (result as any).nativeTransliteration 
                    : result.transliteration}
                </p>
              </div>

              <div className="bg-orange-50/50 p-4 rounded-xl border border-orange-100/50 mt-4">
                 <p className="text-sm font-medium text-gray-700">
                   <span className="font-bold text-orange-800">{pair.sourceLanguage1}:</span> {result.sourceText1}
                 </p>
                 {pair.sourceLanguage2 && (
                   <p className="text-sm font-medium text-gray-700 mt-1">
                     <span className="font-bold text-orange-800">{pair.sourceLanguage2}:</span> {result.sourceText2}
                   </p>
                 )}
              </div>

              <div className="pt-6 border-t border-gray-100 mt-auto">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Word by Word</h3>
                <div className="grid grid-cols-1 gap-2">
                  {result.wordMeanings.map((wm, idx) => (
                    <div key={idx} className="bg-gray-50 p-3 rounded-xl border border-gray-100 flex justify-between items-center">
                      <span className="font-bold text-orange-600">{wm.targetText}</span>
                      <span className="text-sm text-gray-600">{pair.sourceLanguage2 ? `${wm.sourceText2} / ${wm.sourceText1}` : wm.sourceText1}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={handleSave}
                disabled={saved}
                className={`w-full py-3 mt-6 rounded-xl font-bold transition-all ${
                  saved 
                    ? 'bg-green-100 text-green-700 border border-green-200' 
                    : 'bg-white border-2 border-orange-500 text-orange-500 hover:bg-orange-50'
                }`}
              >
                {saved ? 'Saved to Vocabulary!' : 'Save to Vocabulary'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
