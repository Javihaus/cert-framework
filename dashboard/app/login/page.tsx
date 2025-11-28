'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { LogIn, Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react';
import CircularProgress from '@mui/material/CircularProgress';
import { cn } from '@/lib/utils';

export default function LoginPage() {
  const router = useRouter();
  const { login, error: authError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const success = await login(email, password);

    if (success) {
      router.push('/quality');
    } else {
      setError(authError || 'Login failed. Please try again.');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F6F9FC] dark:bg-[#0A0E14] px-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <h1 className="text-[28px] font-bold text-[#10069F] dark:text-[#E8ECF1]">
            CERT Dashboard
          </h1>
          <p className="text-[15px] text-[#596780] dark:text-[#afb6bf] mt-2">
            Sign in to access your LLM monitoring dashboard
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white dark:bg-[#151B24] rounded-xl shadow-sm border border-[#E3E8EE] dark:border-[#1D2530] p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-[13px] text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className="block text-[13px] font-medium text-[#0A2540] dark:text-[#E8ECF1] mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#596780]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@company.com"
                  className="w-full pl-10 pr-4 py-2.5 text-[14px] border border-[#E3E8EE] dark:border-[#1D2530] rounded-lg bg-white dark:bg-[#151B24] text-[#0A2540] dark:text-[#E8ECF1] placeholder:text-[#596780] focus:outline-none focus:ring-2 focus:ring-[#10069F]/20 focus:border-[#10069F]"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-[13px] font-medium text-[#0A2540] dark:text-[#E8ECF1] mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#596780]" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-4 py-2.5 text-[14px] border border-[#E3E8EE] dark:border-[#1D2530] rounded-lg bg-white dark:bg-[#151B24] text-[#0A2540] dark:text-[#E8ECF1] placeholder:text-[#596780] focus:outline-none focus:ring-2 focus:ring-[#10069F]/20 focus:border-[#10069F]"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={cn(
                "w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-[14px] font-medium transition-all",
                loading
                  ? "bg-[#10069F]/70 cursor-not-allowed"
                  : "bg-[#10069F] hover:bg-[#2a3759]",
                "text-white"
              )}
            >
              {loading ? (
                <CircularProgress size={18} sx={{ color: 'white' }} />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#E3E8EE] dark:border-[#1D2530]" />
            </div>
            <div className="relative flex justify-center text-[12px]">
              <span className="px-3 bg-white dark:bg-[#151B24] text-[#596780]">
                New to CERT?
              </span>
            </div>
          </div>

          {/* Register Link */}
          <Link
            href="/register"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-[14px] font-medium border border-[#E3E8EE] dark:border-[#1D2530] text-[#0A2540] dark:text-[#E8ECF1] hover:bg-[#F6F9FC] dark:hover:bg-[#1D2530] transition-colors"
          >
            Create an account
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Footer */}
        <p className="text-center text-[13px] text-[#596780] dark:text-[#afb6bf] mt-6">
          By signing in, you agree to our{' '}
          <a href="#" className="text-[#10069F] dark:text-[#9fc2e9] hover:underline">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="#" className="text-[#10069F] dark:text-[#9fc2e9] hover:underline">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
}
