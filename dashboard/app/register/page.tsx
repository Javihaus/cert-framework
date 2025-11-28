'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { UserPlus, Mail, Lock, User, Building, AlertCircle, ArrowLeft, Check } from 'lucide-react';
import CircularProgress from '@mui/material/CircularProgress';
import { cn } from '@/lib/utils';

export default function RegisterPage() {
  const router = useRouter();
  const { register, error: authError } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F6F9FC] dark:bg-[#0A0E14] px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <h1 className="text-[28px] font-bold text-[#10069F] dark:text-[#E8ECF1]">
            Create Account
          </h1>
          <p className="text-[15px] text-[#596780] dark:text-[#afb6bf] mt-2">
            Start monitoring your LLM applications
          </p>
        </div>

        {/* Register Form */}
        <div className="bg-white dark:bg-[#151B24] rounded-xl shadow-sm border border-[#E3E8EE] dark:border-[#1D2530] p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-[13px] text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Name Field */}
            <div>
              <label className="block text-[13px] font-medium text-[#0A2540] dark:text-[#E8ECF1] mb-2">
                Full Name *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#596780]" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="John Doe"
                  className="w-full pl-10 pr-4 py-2.5 text-[14px] border border-[#E3E8EE] dark:border-[#1D2530] rounded-lg bg-white dark:bg-[#151B24] text-[#0A2540] dark:text-[#E8ECF1] placeholder:text-[#596780] focus:outline-none focus:ring-2 focus:ring-[#10069F]/20 focus:border-[#10069F]"
                />
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-[13px] font-medium text-[#0A2540] dark:text-[#E8ECF1] mb-2">
                Email *
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

            {/* Company Field (Optional) */}
            <div>
              <label className="block text-[13px] font-medium text-[#0A2540] dark:text-[#E8ECF1] mb-2">
                Company <span className="text-[#596780] font-normal">(optional)</span>
              </label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#596780]" />
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Acme Inc."
                  className="w-full pl-10 pr-4 py-2.5 text-[14px] border border-[#E3E8EE] dark:border-[#1D2530] rounded-lg bg-white dark:bg-[#151B24] text-[#0A2540] dark:text-[#E8ECF1] placeholder:text-[#596780] focus:outline-none focus:ring-2 focus:ring-[#10069F]/20 focus:border-[#10069F]"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-[13px] font-medium text-[#0A2540] dark:text-[#E8ECF1] mb-2">
                Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#596780]" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Min. 8 characters"
                  className="w-full pl-10 pr-4 py-2.5 text-[14px] border border-[#E3E8EE] dark:border-[#1D2530] rounded-lg bg-white dark:bg-[#151B24] text-[#0A2540] dark:text-[#E8ECF1] placeholder:text-[#596780] focus:outline-none focus:ring-2 focus:ring-[#10069F]/20 focus:border-[#10069F]"
                />
              </div>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label className="block text-[13px] font-medium text-[#0A2540] dark:text-[#E8ECF1] mb-2">
                Confirm Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#596780]" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Re-enter your password"
                  className="w-full pl-10 pr-4 py-2.5 text-[14px] border border-[#E3E8EE] dark:border-[#1D2530] rounded-lg bg-white dark:bg-[#151B24] text-[#0A2540] dark:text-[#E8ECF1] placeholder:text-[#596780] focus:outline-none focus:ring-2 focus:ring-[#10069F]/20 focus:border-[#10069F]"
                />
              </div>
              {password && confirmPassword && password === confirmPassword && (
                <div className="flex items-center gap-1 mt-1 text-green-600 dark:text-green-400">
                  <Check className="w-3 h-3" />
                  <span className="text-[12px]">Passwords match</span>
                </div>
              )}
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
                  <UserPlus className="w-4 h-4" />
                  Create Account
                </>
              )}
            </button>
          </form>

          {/* Features */}
          <div className="mt-6 pt-6 border-t border-[#E3E8EE] dark:border-[#1D2530]">
            <p className="text-[12px] font-medium text-[#596780] dark:text-[#afb6bf] uppercase tracking-wider mb-3">
              What you get
            </p>
            <ul className="space-y-2">
              {[
                'Persistent trace storage',
                'LLM quality evaluations',
                'Cost & performance monitoring',
                'API key for notebook integration',
              ].map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-[13px] text-[#0A2540] dark:text-[#E8ECF1]">
                  <Check className="w-4 h-4 text-green-500" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Login Link */}
        <Link
          href="/login"
          className="flex items-center justify-center gap-2 mt-6 text-[14px] text-[#596780] dark:text-[#afb6bf] hover:text-[#10069F] dark:hover:text-[#9fc2e9] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Already have an account? Sign in
        </Link>
      </div>
    </div>
  );
}
