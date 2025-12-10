
import React, { useState } from 'react';
import { Loader2, ArrowRight, Lock, Mail, Globe } from 'lucide-react';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth, isConfigured } from '../services/firebase';

interface LoginProps {
  onLogin: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!isConfigured || !auth) {
      // Mock Login Fallback for Demo
      setTimeout(() => {
        setIsLoading(false);
        onLogin();
      }, 1500);
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // App.tsx listener will handle the transition
    } catch (err: any) {
      console.error(err);
      setError("Login failed. Check credentials or try 'demo@xodos.com' / 'demo123'.");
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!isConfigured || !auth) {
        alert("Firebase is not configured in services/firebase.ts yet! Using Demo Login.");
        onLogin(); // Fallback to demo login if not configured
        return;
    }
    
    setIsLoading(true);
    const provider = new GoogleAuthProvider();
    try {
        await signInWithPopup(auth, provider);
        // App.tsx listener will handle transition
    } catch (err: any) {
        console.error(err);
        setError("Google Sign-In failed.");
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent mb-2">
            X-O-DOS
          </h1>
          <p className="text-slate-400">Next-Gen Tokenized Asset Trading</p>
          {!isConfigured && (
              <div className="mt-4 p-2 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-xs rounded">
                  Demo Mode: Firebase not connected.
              </div>
          )}
        </div>

        <form onSubmit={handleEmailLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail size={18} className="text-slate-500" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block w-full pl-10 p-3 placeholder-slate-600 transition-colors"
                placeholder="trader@x-o-dos.ng"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock size={18} className="text-slate-500" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block w-full pl-10 p-3 placeholder-slate-600 transition-colors"
                placeholder="••••••••"
              />
            </div>
          </div>
          
          {error && <p className="text-rose-500 text-sm text-center bg-rose-500/10 p-2 rounded">{error}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 focus:ring-4 focus:ring-emerald-800 font-medium rounded-lg text-sm px-5 py-3 text-center flex items-center justify-center transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin mr-2" /> Authenticating...
              </>
            ) : (
              <>
                Sign In <ArrowRight size={18} className="ml-2" />
              </>
            )}
          </button>
        </form>

        <div className="my-6 flex items-center justify-center">
            <span className="h-px bg-slate-800 w-full"></span>
            <span className="px-3 text-slate-500 text-xs uppercase">Or</span>
            <span className="h-px bg-slate-800 w-full"></span>
        </div>

        <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 font-medium rounded-lg text-sm px-5 py-3 flex items-center justify-center transition-all disabled:opacity-50"
        >
            <Globe size={18} className="mr-2" /> Continue with Google
        </button>

        <div className="mt-6 text-center text-sm">
          <p className="text-slate-500">
            Don't have an account?{' '}
            <a href="#" className="font-medium text-emerald-400 hover:text-emerald-300 transition-colors">
              Request Access
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};
