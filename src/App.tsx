import { Routes, Route, NavLink, BrowserRouter, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Learn from './pages/Learn';
import Quiz from './pages/Quiz';
import Generate from './pages/Generate';
import Translate from './pages/Translate';
import SignIn from './pages/SignIn';
import LanguageSelect from './pages/LanguageSelect';
import { LayoutDashboard, BookOpen, BrainCircuit, Sparkles, Languages, ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { initDb, syncFromFirebase, syncToFirebase } from './db';
import { auth } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useCurrentLanguagePair } from './hooks/useCurrentLanguagePair';

function Navigation() {
  const pair = useCurrentLanguagePair();

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
      isActive
        ? 'bg-orange-100 text-orange-700 font-semibold'
        : 'text-gray-600 hover:bg-orange-50 hover:text-orange-600'
    }`;

  return (
    <nav className="bg-white border-b border-orange-100 sticky top-0 z-10 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between py-3 gap-4">
          <div className="flex items-center space-x-4 whitespace-nowrap">
            <NavLink to="/select-language" className="text-gray-500 hover:text-orange-600 transition-colors">
              <ArrowLeft size={20} />
            </NavLink>
            <div className="flex items-center space-x-2">
              <span className="text-3xl pt-1 bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent" style={{ fontFamily: "'Yatra One', cursive" }}>
                bhaashaa {pair?.icon || '🗣️'}
              </span>
              <span className="text-sm font-medium text-gray-500 hidden lg:inline">
                Learn {pair?.targetLanguage || 'Language'} via {pair?.sourceLanguage1 || 'Source'}
              </span>
            </div>
          </div>
          <div className="flex space-x-1 sm:space-x-2 overflow-x-auto pb-1 sm:pb-0 hide-scrollbar flex-1 justify-center min-w-[300px]">
            <NavLink to="/app" end className={linkClass}>
              <LayoutDashboard size={18} />
              <span className="hidden sm:inline">Dashboard</span>
            </NavLink>
            <NavLink to="/app/learn" className={linkClass}>
              <BookOpen size={18} />
              <span className="hidden sm:inline">Learn</span>
            </NavLink>
            <NavLink to="/app/quiz" className={linkClass}>
              <BrainCircuit size={18} />
              <span className="hidden sm:inline">Quiz</span>
            </NavLink>
            <NavLink to="/app/translate" className={linkClass}>
              <Languages size={18} />
              <span className="hidden sm:inline">Translate</span>
            </NavLink>
            <NavLink to="/app/generate" className={linkClass}>
              <Sparkles size={18} />
              <span className="hidden sm:inline">Generate</span>
            </NavLink>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-600 hidden sm:inline">{auth.currentUser?.email}</span>
          </div>
        </div>
      </div>
    </nav>
  );
}

function MainApp() {
  return (
    <div className="min-h-screen bg-orange-50 font-sans text-gray-900 pb-16">
      <Navigation />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/learn" element={<Learn />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/translate" element={<Translate />} />
          <Route path="/generate" element={<Generate />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [isGuest, setIsGuest] = useState(() => localStorage.getItem('isGuest') === 'true');

  useEffect(() => {
    initDb().catch(console.error);

    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        // Sync local to remote and then remote to local on login
        await syncToFirebase();
        await syncFromFirebase();
      }
    });

    return () => unsubscribe();
  }, []);

  const handleGuestSignIn = () => {
    localStorage.setItem('isGuest', 'true');
    setIsGuest(true);
  };

  const handleSignOut = () => {
    localStorage.removeItem('isGuest');
    setIsGuest(false);
    auth.signOut();
  };

  const isAuthenticated = !!user || isGuest;

  if (user === undefined && !isGuest) {
    return <div className="min-h-screen bg-[#121212] flex items-center justify-center text-white">Loading...</div>;
  }

  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen relative pb-12">
        <Routes>
          <Route 
            path="/signin" 
            element={!isAuthenticated ? <SignIn onGuestSignIn={handleGuestSignIn} /> : <Navigate to="/select-language" replace />} 
          />
          <Route 
            path="/select-language" 
            element={isAuthenticated ? <LanguageSelect onSignOut={handleSignOut} /> : <Navigate to="/signin" replace />} 
          />
          <Route 
            path="/app/*" 
            element={isAuthenticated ? <MainApp /> : <Navigate to="/signin" replace />} 
          />
          <Route 
            path="*" 
            element={<Navigate to={isAuthenticated ? "/select-language" : "/signin"} replace />} 
          />
        </Routes>
        
        <footer className="fixed bottom-0 w-full bg-white border-t border-gray-200 py-2 px-4 text-xs text-gray-500 text-center flex flex-col md:flex-row items-center justify-center gap-1 z-50">
          <span><span className="font-bold text-gray-700">ⓘ</span> Bhaashaa is a GenAI webapp, hence it can make mistakes. Please double check responses.</span>
          <span className="hidden md:inline mx-2">|</span>
          <span>&copy; 2026 Bhaashaa - Built by <a href="https://vivek-ai-web.vercel.app/" target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:underline">VivekAI</a></span>
        </footer>
      </div>
    </BrowserRouter>
  );
}
