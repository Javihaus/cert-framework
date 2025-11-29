'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { LuCircleAlert, LuCheck, LuLoader } from 'react-icons/lu';

export default function RegisterPage() {
  const router = useRouter();
  const { register, user, loading: authLoading, error: authError } = useAuth();
  const [darkMode, setDarkMode] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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

    // Validation
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    const success = await register({
      name,
      email,
      password,
      company: company || undefined,
    });

    if (success) {
      router.push('/quality');
    } else {
      setError(authError || 'Registration failed. Please try again.');
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
            Start monitoring<br />your LLM apps today
          </h1>
          <p className="text-white/70 text-lg max-w-md">
            Get instant visibility into your AI applications with real-time tracing, automated evaluations, and cost tracking.
          </p>

          {/* Features list */}
          <div className="space-y-4 pt-4">
            {[
              'Persistent trace storage linked to your account',
              'Automated LLM quality evaluations',
              'Cost & performance monitoring',
              'API key for notebook integration',
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3 text-white/80">
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <LuCheck className="w-3 h-3" />
                </div>
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="text-white/50 text-sm">
          &copy; {new Date().getFullYear()} CERT Framework
        </div>
      </div>

      {/* Right Panel - Register Form */}
      <div className="flex-1 flex items-center justify-center bg-[#F6F9FC] dark:bg-[#0A0E14] px-6 py-12 overflow-y-auto">
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
              Create your account
            </h2>
            <p className="text-[#596780] dark:text-[#8792A2] mt-2">
              Start monitoring your LLM applications
            </p>
          </div>

          {/* Register Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <LuCircleAlert className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Name Field */}
            <div>
              <label className="block text-sm font-medium text-[#0A2540] dark:text-[#E8ECF1] mb-1.5">
                Full name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="John Doe"
                className="w-full px-4 py-3 text-sm border border-[#E3E8EE] dark:border-[#2D3748] rounded-lg bg-white dark:bg-[#1D2530] text-[#0A2540] dark:text-white placeholder:text-[#8792A2] focus:outline-none focus:ring-2 focus:ring-[#10069f]/20 dark:focus:ring-[#9fc2e9]/20 focus:border-[#10069f] dark:focus:border-[#9fc2e9]"
              />
            </div>

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

            {/* Company Field (Optional) */}
            <div>
              <label className="block text-sm font-medium text-[#0A2540] dark:text-[#E8ECF1] mb-1.5">
                Company <span className="text-[#8792A2] font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Acme Inc."
                className="w-full px-4 py-3 text-sm border border-[#E3E8EE] dark:border-[#2D3748] rounded-lg bg-white dark:bg-[#1D2530] text-[#0A2540] dark:text-white placeholder:text-[#8792A2] focus:outline-none focus:ring-2 focus:ring-[#10069f]/20 dark:focus:ring-[#9fc2e9]/20 focus:border-[#10069f] dark:focus:border-[#9fc2e9]"
              />
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-[#0A2540] dark:text-[#E8ECF1] mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Min. 8 characters"
                className="w-full px-4 py-3 text-sm border border-[#E3E8EE] dark:border-[#2D3748] rounded-lg bg-white dark:bg-[#1D2530] text-[#0A2540] dark:text-white placeholder:text-[#8792A2] focus:outline-none focus:ring-2 focus:ring-[#10069f]/20 dark:focus:ring-[#9fc2e9]/20 focus:border-[#10069f] dark:focus:border-[#9fc2e9]"
              />
            </div>

            {/* Confirm Password Field */}
            <div>
              <label className="block text-sm font-medium text-[#0A2540] dark:text-[#E8ECF1] mb-1.5">
                Confirm password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Re-enter your password"
                className="w-full px-4 py-3 text-sm border border-[#E3E8EE] dark:border-[#2D3748] rounded-lg bg-white dark:bg-[#1D2530] text-[#0A2540] dark:text-white placeholder:text-[#8792A2] focus:outline-none focus:ring-2 focus:ring-[#10069f]/20 dark:focus:ring-[#9fc2e9]/20 focus:border-[#10069f] dark:focus:border-[#9fc2e9]"
              />
              {password && confirmPassword && password === confirmPassword && (
                <div className="flex items-center gap-1 mt-1.5 text-green-600 dark:text-green-400">
                  <LuCheck className="w-3 h-3" />
                  <span className="text-xs">Passwords match</span>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-[#10069f] hover:bg-[#0d0580] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading && <LuLoader className="w-4 h-4 animate-spin" />}
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          {/* Login Link */}
          <p className="text-center text-sm text-[#596780] dark:text-[#8792A2] mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-[#10069f] dark:text-[#9fc2e9] font-medium hover:underline">
              Sign in
            </Link>
          </p>

          {/* Terms */}
          <p className="text-center text-xs text-[#8792A2] mt-6">
            By creating an account, you agree to our{' '}
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
