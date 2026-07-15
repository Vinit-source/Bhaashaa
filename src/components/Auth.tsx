import { auth } from '../firebase';
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { useAuthState } from 'react-firebase-hooks/auth';
import { LogIn, LogOut } from 'lucide-react';

export function AuthButton() {
  const [user, loading] = useAuthState(auth);

  if (loading) {
    return <div className="text-sm text-gray-500">Loading...</div>;
  }

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-gray-600 hidden sm:inline">{user.email}</span>
        <button
          onClick={() => signOut(auth)}
          className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    );
  }

  const handleSignIn = () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider).catch(console.error);
  };

  return (
    <button
      onClick={handleSignIn}
      className="flex items-center gap-2 bg-orange-100 hover:bg-orange-200 text-orange-700 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
    >
      <LogIn size={16} />
      <span>Sign In</span>
    </button>
  );
}
