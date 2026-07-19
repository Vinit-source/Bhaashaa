import React, { useState } from 'react';
import { auth } from '../firebase';
import { signInWithPopup, GoogleAuthProvider, OAuthProvider, signInAnonymously } from 'firebase/auth';

export default function SignIn({ onGuestSignIn }: { onGuestSignIn?: () => void }) {
  const [error, setError] = useState<string | null>(null);

  const handleError = (error: any) => {
    console.error(error);
    let message = "An error occurred during sign in.";
    if (error.code === 'auth/network-request-failed') {
      message = "Network error. Please check your connection.";
    } else if (error.code === 'auth/admin-restricted-operation') {
      message = "This sign-in method is currently disabled in the Firebase console.";
    } else if (error.code === 'auth/popup-closed-by-user') {
      message = "Sign-in popup was closed before completing.";
    } else if (error.message) {
      message = error.message;
    }
    setError(message);
  };

  const handleGoogleSignIn = () => {
    setError(null);
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider).catch(handleError);
  };

  const handleAppleSignIn = () => {
    setError(null);
    const provider = new OAuthProvider('apple.com');
    signInWithPopup(auth, provider).catch(handleError);
  };

  const handleGuestSignIn = () => {
    setError(null);
    if (onGuestSignIn) {
      onGuestSignIn();
    } else {
      signInAnonymously(auth).catch(handleError);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center relative"
      style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1582510003544-4d00b7f74220?q=80&w=2000&auto=format&fit=crop")' }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-orange-900/60 to-red-900/80 backdrop-blur-[2px]"></div>
      
      <div className="bg-white/95 backdrop-blur-md rounded-[2rem] w-full max-w-md p-8 md:p-12 flex flex-col items-center text-center shadow-2xl relative z-10 border border-orange-100">
        <div className="mb-6">
          <div className="flex flex-col items-center gap-3">
            <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center shadow-lg shadow-orange-500/30">
              <span className="text-4xl">🗣️</span>
            </div>
          </div>
        </div>

        <h1 
          className="text-4xl md:text-5xl text-[#d04b2b] mb-3"
          style={{ fontFamily: "'Yatra One', cursive" }}
        >
          bhaashaa
        </h1>
        <p className="text-gray-600 font-medium text-sm md:text-base leading-relaxed mb-8 px-4">
          Learn any language using AI
        </p>

        {error && (
          <div className="w-full bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-6 text-sm text-left">
            {error}
          </div>
        )}

        <div className="w-full space-y-4">
          <button
            onClick={handleGoogleSignIn}
            className="w-full bg-white border border-gray-200 text-gray-700 font-bold rounded-full py-3.5 px-4 flex items-center justify-center gap-3 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Sign in with Google
          </button>

          <button
            onClick={handleAppleSignIn}
            className="w-full bg-black text-white font-bold rounded-full py-3.5 px-4 flex items-center justify-center gap-3 hover:bg-gray-900 transition-colors shadow-sm"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true" fill="currentColor">
              <path d="M16.365 1.43c0 1.14-.493 2.27-1.177 3.08-.74.887-1.99 1.57-2.96 1.57-.146 0-.28-.01-.41-.03-.02-1.12.51-2.26 1.2-3.08.73-.89 1.94-1.55 2.94-1.55.15 0 .31.02.407.01zm.99 4.31c-1.34 0-2.58.74-3.23.74-.63 0-1.87-.73-3.1-.73-1.63 0-3.12 1.04-3.95 2.45-1.74 3.02-.45 7.48 1.25 9.94.84 1.2 1.83 2.53 3.12 2.53 1.25 0 1.66-.75 3.22-.75s1.95.75 3.25.75c1.33 0 2.22-1.24 3.05-2.43.96-1.4 1.36-2.76 1.4-2.84-.03-.01-2.66-1.02-2.66-4.04 0-2.53 2.07-3.76 2.17-3.81-1.2-1.74-3.04-1.97-3.52-2.02z" />
            </svg>
            Sign in with Apple
          </button>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-400">Or continue as guest</span>
            </div>
          </div>

          <button
            onClick={handleGuestSignIn}
            className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold rounded-full py-3.5 px-4 flex items-center justify-center gap-3 hover:from-orange-600 hover:to-red-700 transition-all shadow-md hover:shadow-lg"
          >
            Sign in as Guest
          </button>
        </div>
      </div>
    </div>
  );
}
