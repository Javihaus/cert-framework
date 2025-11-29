'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { LuCircleAlert, LuLoader } from 'react-icons/lu';

export default function LoginPage() {
  const router = useRouter();
  const { login, user, loading: authLoading, error: authError } = useAuth();
  const [darkMode, setDarkMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check dark mode and redirect if already logged in
  useEffect(() => {
    const saved = localStorage.getItem('cert-dark-mode');
    if (saved) {
      setDarkMode(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    if (user && !authLoading) {
      router.push('/quality');
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const success = await login(email, password);

    if (success) {
      router.push('/quality');
    } else {
      setError(authError || 'Invalid email or password');
    }

    setLoading(false);
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center bg-[#F6F9FC] ${darkMode ? 'dark:bg-[#0A0E14]' : ''}`}>
        <LuLoader className="w-8 h-8 text-[#10069f] animate-spin" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex ${darkMode ? 'dark' : ''}`}>
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#10069f] dark:bg-[#0A0E14] flex-col justify-between p-12">
        <div>
          <div className="flex items-center gap-3">
            <Image
              src="/cert-logo-alt.png"
              alt="CERT"
              width={64}
              height={64}
              className="object-contain"
            />
            <span className="text-white text-xl font-semibold">CERT</span>
          </div>
        </div>

        <div className="space-y-6">
          <h1 className="text-4xl font-bold text-white leading-tight">
            LLM Monitoring<br />& Evaluation Platform
          </h1>
          <p className="text-white/70 text-lg max-w-md">
            Track, evaluate, and optimize your AI applications with real-time observability and automated quality assessments.
          </p>
          <div className="flex flex-wrap gap-4 pt-4">
            <div className="flex items-center gap-2 text-white/80 text-sm">
              <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              Quality Evaluations
            </div>
            <div className="flex items-center gap-2 text-white/80 text-sm">
              <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              Cost Analysis
            </div>
            <div className="flex items-center gap-2 text-white/80 text-sm">
              <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              Performance Metrics
            </div>
          </div>
        </div>

        <div className="text-white/50 text-sm">
          &copy; {new Date().getFullYear()} CERT Framework
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center bg-[#F6F9FC] dark:bg-[#0A0E14] px-6 py-12">
        <div className="w-full max-w-[400px]">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Image
                src="/cert-logo-alt.png"
                alt="CERT"
                width={64}
                height={64}
                className="object-contain"
              />
              <span className="text-[#10069f] dark:text-white text-xl font-semibold">CERT</span>
            </div>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold text-[#0A2540] dark:text-white">
              Sign in to your account
            </h2>
            <p className="text-[#596780] dark:text-[#8792A2] mt-2">
              Access your LLM monitoring dashboard
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <LuCircleAlert className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-[#0A2540] dark:text-[#E8ECF1] mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@company.com"
                className="w-full px-4 py-3 text-sm border border-[#E3E8EE] dark:border-[#2D3748] rounded-lg bg-white dark:bg-[#1D2530] text-[#0A2540] dark:text-white placeholder:text-[#8792A2] focus:outline-none focus:ring-2 focus:ring-[#10069f]/20 dark:focus:ring-[#9fc2e9]/20 focus:border-[#10069f] dark:focus:border-[#9fc2e9]"
              />
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-[#0A2540] dark:text-[#E8ECF1]">
                  Password
                </label>
                <a href="#" className="text-sm text-[#10069f] dark:text-[#9fc2e9] hover:underline">
                  Forgot password?
                </a>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
                className="w-full px-4 py-3 text-sm border border-[#E3E8EE] dark:border-[#2D3748] rounded-lg bg-white dark:bg-[#1D2530] text-[#0A2540] dark:text-white placeholder:text-[#8792A2] focus:outline-none focus:ring-2 focus:ring-[#10069f]/20 dark:focus:ring-[#9fc2e9]/20 focus:border-[#10069f] dark:focus:border-[#9fc2e9]"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-[#10069f] hover:bg-[#0d0580] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading && <LuLoader className="w-4 h-4 animate-spin" />}
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          {/* Register Link */}
          <p className="text-center text-sm text-[#596780] dark:text-[#8792A2] mt-6">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-[#10069f] dark:text-[#9fc2e9] font-medium hover:underline">
              Sign up
            </Link>
          </p>

          {/* Terms */}
          <p className="text-center text-xs text-[#8792A2] mt-6">
            By signing in, you agree to our{' '}
            <a href="/privacy" className="text-[#10069f] dark:text-[#9fc2e9] hover:underline">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/privacy" className="text-[#10069f] dark:text-[#9fc2e9] hover:underline">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
