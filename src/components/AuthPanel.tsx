import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, LogIn, UserPlus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { TaskFlowLogo } from './TaskFlowLogo';

export function AuthPanel() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    if (!supabase) {
      setErrorMessage('Supabase client is not configured.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
        });
        if (error) {
          setErrorMessage(error.message);
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
        });
        if (error) {
          setErrorMessage(error.message);
        } else if (!data.session) {
          setInfoMessage(
            'Account created. Check your email inbox to confirm your address before signing in.'
          );
          setMode('signin');
        }
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Authentication request failed.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-white/10 bg-[#171F35] p-6 sm:p-8 shadow-xl shadow-black/25">
      <div className="mb-6">
        <TaskFlowLogo />
      </div>

      <h1 className="font-display text-2xl font-bold tracking-tight text-white">
        {mode === 'signin' ? 'Sign in to TaskFlow' : 'Create your account'}
      </h1>
      <p className="mt-1.5 text-sm text-slate-400">
        {mode === 'signin'
          ? 'Sign in with your Supabase account to access your tasks and progress.'
          : 'Register an account to store and sync your tasks in Supabase.'}
      </p>

      {errorMessage && (
        <div
          role="alert"
          className="mt-4 flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-xs font-medium text-red-300"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" aria-hidden="true" />
          <span>{errorMessage}</span>
        </div>
      )}

      {infoMessage && (
        <div
          role="status"
          className="mt-4 flex items-start gap-2.5 rounded-xl border border-[#10B981]/30 bg-[#10B981]/10 px-3.5 py-2.5 text-xs font-medium text-emerald-300"
        >
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#10B981]" aria-hidden="true" />
          <span>{infoMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
        <div>
          <label
            htmlFor="auth-email"
            className="block text-sm font-medium text-slate-200"
          >
            Email
          </label>
          <input
            id="auth-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            disabled={isSubmitting}
            className="mt-1.5 block w-full min-h-[44px] rounded-xl border border-white/10 bg-[#0B1020] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 transition-colors focus:border-[#8B5CF6] focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/25 disabled:opacity-60"
          />
        </div>

        <div>
          <label
            htmlFor="auth-password"
            className="block text-sm font-medium text-slate-200"
          >
            Password
          </label>
          <input
            id="auth-password"
            type="password"
            autoComplete={
              mode === 'signin' ? 'current-password' : 'new-password'
            }
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            disabled={isSubmitting}
            className="mt-1.5 block w-full min-h-[44px] rounded-xl border border-white/10 bg-[#0B1020] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 transition-colors focus:border-[#8B5CF6] focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/25 disabled:opacity-60"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex w-full min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#8B5CF6] px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-[#7C3AED] disabled:cursor-not-allowed disabled:opacity-60 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6] focus-visible:ring-offset-2 focus-visible:ring-offset-[#171F35]"
        >
          {mode === 'signin' ? (
            <>
              <LogIn className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{isSubmitting ? 'Signing in...' : 'Sign In'}</span>
            </>
          ) : (
            <>
              <UserPlus className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>
                {isSubmitting ? 'Creating account...' : 'Create Account'}
              </span>
            </>
          )}
        </button>
      </form>

      <div className="mt-6 border-t border-white/10 pt-4 text-center text-sm text-slate-400">
        {mode === 'signin' ? (
          <>
            Need an account?{' '}
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setErrorMessage(null);
                setInfoMessage(null);
              }}
              className="font-semibold text-[#3B82F6] hover:text-blue-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6] rounded-sm"
            >
              Sign up
            </button>
          </>
        ) : (
          <>
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setErrorMessage(null);
                setInfoMessage(null);
              }}
              className="font-semibold text-[#3B82F6] hover:text-blue-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6] rounded-sm"
            >
              Sign in
            </button>
          </>
        )}
      </div>
    </div>
  );
}
