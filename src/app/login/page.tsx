'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, AlertCircle, Sparkles, Loader2, LogOut, CheckCircle2 } from 'lucide-react';
import { auth, googleProvider } from '@/lib/firebase';
import { signInWithPopup, signOut } from 'firebase/auth';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorInfo, setErrorInfo] = useState<{ title: string; message: string; email?: string } | null>(null);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setErrorInfo(null);

      // 1. Authenticate with Google via Firebase Client SDK
      const credential = await signInWithPopup(auth, googleProvider);
      const user = credential.user;

      if (!user) {
        throw new Error('No user data returned from Google');
      }

      // 2. Obtain verified Google / Firebase ID token
      const idToken = await user.getIdToken(true);

      // 3. Send ID token to Server-Side verification & authorization gatekeeper
      const res = await fetch('/api/auth/firebase-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      const data = await res.json();

      if (!res.ok) {
        await signOut(auth);
        setErrorInfo({
          title: res.status === 403 ? 'Access Denied' : 'Authentication Error',
          message: data.message || data.error || 'Only authorized administrators have permission to access DocMail.',
          email: data.email || user.email || undefined,
        });
        setLoading(false);
        return;
      }

      // 4. Authorized administrator confirmed by server
      router.push(data.redirect || '/');
      router.refresh();
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      // Don't show scary error if user simply closed the popup
      if (err.code === 'auth/popup-closed-by-user') {
        setLoading(false);
        return;
      }
      setErrorInfo({
        title: 'Authentication Failed',
        message: err.message || 'Unable to sign in with Google. Please verify your credentials and try again.',
      });
      setLoading(false);
    }
  };

  const handleSwitchAccount = async () => {
    await signOut(auth);
    setErrorInfo(null);
    handleGoogleSignIn();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 select-none">
      <div className="glass-surface max-w-md w-full p-8 sm:p-10 space-y-7 text-center shadow-2xl relative border border-white/60">
        {/* Authentic Docdril Logo */}
        <div className="w-20 h-20 glass-card rounded-3xl overflow-hidden flex items-center justify-center mx-auto p-4 bg-white shadow-lg border border-white/80 transition-transform duration-300 hover:scale-105">
          <img src="/docdril.svg" alt="Docdril" className="w-full h-full object-contain" />
        </div>

        {/* Header Title */}
        <div className="space-y-1.5">
          <div className="inline-flex items-center space-x-1.5 glass-inset px-3 py-1 rounded-full text-[11px] font-bold text-slate-700 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-rose-500" />
            <span>Docdril Communication</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            DocMail Platform
          </h1>
          <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
            Enterprise business communication and agentic email infrastructure.
          </p>
        </div>

        {/* Unauthorized / Error Banners */}
        {errorInfo && (
          <div className="glass-card p-4 bg-rose-50/90 border border-rose-200 text-rose-700 text-xs rounded-2xl text-left space-y-2 shadow-sm animate-in fade-in duration-200">
            <div className="font-bold flex items-center space-x-1.5 text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{errorInfo.title}</span>
            </div>
            <p className="text-[11.5px] text-rose-700 leading-relaxed pl-5.5">
              {errorInfo.message}
            </p>
            {errorInfo.email && (
              <div className="pl-5.5 pt-1">
                <span className="inline-block px-2 py-0.5 rounded-md bg-rose-100 font-mono text-[10px] text-rose-800 font-semibold border border-rose-200">
                  {errorInfo.email}
                </span>
              </div>
            )}
            <div className="pl-5.5 pt-2">
              <button
                onClick={handleSwitchAccount}
                className="text-[11px] font-bold text-rose-700 hover:text-rose-900 underline flex items-center space-x-1"
              >
                <LogOut className="w-3 h-3" />
                <span>Sign in with a different Google account</span>
              </button>
            </div>
          </div>
        )}

        {/* Server-Side Enforced Google Sign-In Action */}
        <div className="space-y-3 pt-2">
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center space-x-3 bg-white hover:bg-slate-50 disabled:bg-slate-100 disabled:opacity-75 text-slate-800 border border-slate-200/90 shadow-md hover:shadow-lg py-3.5 px-4 rounded-2xl font-bold text-xs transition-all cursor-pointer"
          >
            {loading ? (
              <div className="flex items-center space-x-2 text-slate-600">
                <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
                <span>Verifying Administrator Access...</span>
              </div>
            ) : (
              <>
                {/* Google Vector Icon */}
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.41 7.32 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.16 0 9.98 0 12s.45 3.84 1.24 5.42l4.04-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.32 0 3.26 2.59 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>Sign in with Google</span>
              </>
            )}
          </button>
        </div>

        {/* Security Footer Notice */}
        <div className="pt-4 border-t border-slate-200/50 space-y-1 text-center">
          <div className="text-[11px] font-semibold text-slate-700 flex items-center justify-center space-x-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Authorized Administrators Only</span>
          </div>
          <p className="text-[10px] text-slate-500">
            Server-side token verification via Google Identity & Firebase Auth
          </p>
        </div>
      </div>
    </div>
  );
}
