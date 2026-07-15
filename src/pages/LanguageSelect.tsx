import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Plus, X, Trash2 } from 'lucide-react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, LanguagePair } from '../db';

export default function LanguageSelect({ onSignOut }: { onSignOut?: () => void }) {
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const [newTarget, setNewTarget] = useState('');
  const [newSource1, setNewSource1] = useState('');
  const [newSource2, setNewSource2] = useState('');
  
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const languagePairs = useLiveQuery(() => db.languagePairs.toArray()) || [];

  const handleSignOut = () => {
    if (onSignOut) {
      onSignOut();
    } else {
      signOut(auth);
    }
  };

  const handleSelectPair = async (pairId: string) => {
    localStorage.setItem('currentLanguagePairId', pairId);
    
    // Check if there are sentences for this pair
    const sentencesCount = await db.sentences.filter(s => s.languagePairId === pairId).count();
    
    if (sentencesCount === 0) {
      navigate('/app/generate', { state: { defaultCount: 5 } });
    } else {
      navigate(`/app`);
    }
  };

  const handleDeletePair = (e: React.MouseEvent, pairId: string) => {
    e.stopPropagation();
    setDeleteConfirmId(pairId);
    setDeleteConfirmText('');
  };

  const confirmDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (deleteConfirmText.toLowerCase() === 'delete' && deleteConfirmId) {
      await db.languagePairs.delete(deleteConfirmId);
      
      const sentencesToDelete = await db.sentences.filter(s => s.languagePairId === deleteConfirmId).primaryKeys();
      await db.sentences.bulkDelete(sentencesToDelete);
      
      const statsToDelete = await db.quizStats.filter(q => q.languagePairId === deleteConfirmId).primaryKeys();
      await db.quizStats.bulkDelete(statsToDelete);
      
      setDeleteConfirmId(null);
      setDeleteConfirmText('');
    }
  };

  const handleCreateNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTarget || !newSource1) return;

    const newId = `${newTarget.substring(0, 2).toLowerCase()}-${newSource1.substring(0, 2).toLowerCase()}${newSource2 ? '-' + newSource2.substring(0, 2).toLowerCase() : ''}`;
    
    await db.languagePairs.add({
      id: newId + '-' + Date.now(),
      targetLanguage: newTarget,
      sourceLanguage1: newSource1,
      sourceLanguage2: newSource2,
      description: `Learn spoken ${newTarget} through ${newSource1}${newSource2 ? ' and ' + newSource2 : ''}.`,
      icon: '🗣️'
    });

    setIsCreating(false);
    setNewTarget('');
    setNewSource1('');
    setNewSource2('');
  };

  return (
    <div className="min-h-screen bg-orange-50 p-4 md:p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Select Language Pair</h1>
            <p className="text-gray-500 mt-2">Choose the language you want to learn.</p>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-xl font-medium transition-colors shadow-sm"
          >
            <LogOut size={18} />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {languagePairs.map(pair => (
            <div 
              key={pair.id}
              onClick={() => handleSelectPair(pair.id!)}
              className="bg-white rounded-3xl p-6 border-2 border-transparent hover:border-orange-200 hover:shadow-xl transition-all cursor-pointer flex flex-col items-center text-center relative group"
            >
              <button
                onClick={(e) => handleDeletePair(e, pair.id!)}
                className="absolute top-4 right-4 text-gray-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors opacity-0 group-hover:opacity-100"
              >
                <X size={20} />
              </button>
              <div className="w-20 h-20 bg-orange-100 text-4xl rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                {pair.icon || '🗣️'}
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Learn {pair.targetLanguage}
              </h2>
              <p className="text-sm font-semibold text-orange-600 mb-4 uppercase tracking-wide">
                via {pair.sourceLanguage1} {pair.sourceLanguage2 && `/ ${pair.sourceLanguage2}`}
              </p>
              <p className="text-gray-500 text-sm">
                {pair.description}
              </p>
            </div>
          ))}

          <div 
            onClick={() => setIsCreating(true)}
            className="bg-orange-100/50 rounded-3xl p-6 border-2 border-dashed border-orange-300 hover:border-orange-400 hover:bg-orange-100 transition-all cursor-pointer flex flex-col items-center justify-center text-center group min-h-[250px]"
          >
            <div className="w-16 h-16 bg-white text-orange-500 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-sm">
              <Plus size={32} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Learn a new language
            </h2>
            <p className="text-gray-500 text-sm">
              Create a custom language pair
            </p>
          </div>
        </div>
      </div>

      {isCreating && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full relative animate-in zoom-in-95">
            <button 
              onClick={() => setIsCreating(false)}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">New Language Pair</h2>
            <form onSubmit={handleCreateNew} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Language (to learn)</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Malayalam"
                  value={newTarget}
                  onChange={e => setNewTarget(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Primary Source Language (you know)</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. English"
                  value={newSource1}
                  onChange={e => setNewSource1(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Secondary Source Language (Optional)</label>
                <input 
                  type="text" 
                  placeholder="e.g. Tamil"
                  value={newSource2}
                  onChange={e => setNewSource2(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              <button 
                type="submit"
                className="w-full mt-6 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-4 rounded-xl transition-colors"
              >
                Create Language Pair
              </button>
            </form>
          </div>
        </div>
      )}

      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full relative animate-in zoom-in-95 border-2 border-red-100">
            <button 
              onClick={() => setDeleteConfirmId(null)}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
              <Trash2 size={24} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Delete Language Pair</h2>
            <p className="text-gray-600 mb-6">
              This will permanently delete this language pair along with all its saved sentences and quiz history. This action cannot be undone.
            </p>
            <form onSubmit={confirmDelete} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type <strong>delete</strong> to confirm:
                </label>
                <input 
                  type="text"
                  required
                  placeholder="delete"
                  value={deleteConfirmText}
                  onChange={e => setDeleteConfirmText(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              <button 
                type="submit"
                disabled={deleteConfirmText.toLowerCase() !== 'delete'}
                className="w-full mt-6 bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Permanently Delete
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
