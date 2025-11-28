'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { LuCircleAlert, LuCheck } from 'react-icons/lu';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/joy/Button';
import { CssVarsProvider, extendTheme } from '@mui/joy/styles';

// Google Icon SVG
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
    <path d="M9.003 18c2.43 0 4.467-.806 5.956-2.18l-2.909-2.26c-.806.54-1.836.86-3.047.86-2.344 0-4.328-1.584-5.036-3.711H.96v2.332A8.997 8.997 0 0 0 9.003 18z" fill="#34A853"/>
    <path d="M3.964 10.712A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.96A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.96 4.042l3.004-2.33z" fill="#FBBC05"/>
    <path d="M9.003 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.464.891 11.428 0 9.002 0A8.997 8.997 0 0 0 .96 4.958l3.004 2.332c.708-2.127 2.692-3.71 5.036-3.71z" fill="#EA4335"/>
  </svg>
);

// GitHub Icon SVG
const GitHubIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
  </svg>
);

// Custom theme for MUI Joy
const theme = extendTheme({
  colorSchemes: {
    light: {
      palette: {
        primary: {
          500: '#10069f',
          600: '#0d0580',
          solidBg: '#10069f',
          solidHoverBg: '#0d0580',
        },
      },
    },
    dark: {
      palette: {
        primary: {
          500: '#9fc2e9',
          600: '#8ab4de',
          solidBg: '#9fc2e9',
          solidHoverBg: '#8ab4de',
          solidColor: '#0A2540',
        },
      },
    },
  },
});

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

  const handleOAuthSignup = (provider: 'google' | 'github') => {
    setError(`${provider.charAt(0).toUpperCase() + provider.slice(1)} signup coming soon`);
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F6F9FC] dark:bg-[#0A0E14]">
        <CircularProgress sx={{ color: '#10069f' }} />
      </div>
    );
  }

  return (
    <CssVarsProvider theme={theme} defaultMode={darkMode ? 'dark' : 'light'}>
      <div className={`min-h-screen flex ${darkMode ? 'dark' : ''}`}>
        {/* Left Panel - Branding */}
        <div className="hidden lg:flex lg:w-1/2 bg-[#10069f] dark:bg-[#0A0E14] flex-col justify-between p-12">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden bg-white/10">
                <Image
                  src="/cert-logo.png"
                  alt="CERT"
                  width={32}
                  height={32}
                  className="object-contain"
                />
              </div>
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
                <div className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden">
                  <Image
                    src="/cert-logo.png"
                    alt="CERT"
                    width={40}
                    height={40}
                    className="object-contain"
                  />
                </div>
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

            {/* OAuth Buttons */}
            <div className="space-y-3 mb-6">
              <button
                onClick={() => handleOAuthSignup('google')}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white dark:bg-[#1D2530] border border-[#E3E8EE] dark:border-[#2D3748] rounded-lg text-[#0A2540] dark:text-white font-medium hover:bg-[#F6F9FC] dark:hover:bg-[#252D3A] transition-colors"
              >
                <GoogleIcon />
                Continue with Google
              </button>

              <button
                onClick={() => handleOAuthSignup('github')}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-[#24292e] hover:bg-[#1b1f23] border border-[#24292e] rounded-lg text-white font-medium transition-colors"
              >
                <GitHubIcon />
                Continue with GitHub
              </button>
            </div>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#E3E8EE] dark:border-[#2D3748]" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-[#F6F9FC] dark:bg-[#0A0E14] text-[#596780] dark:text-[#8792A2]">
                  or sign up with email
                </span>
              </div>
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

              {/* Submit Button - MUI Joy */}
              <Button
                type="submit"
                loading={loading}
                fullWidth
                sx={{
                  py: 1.5,
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                  borderRadius: '8px',
                  bgcolor: darkMode ? '#9fc2e9' : '#10069f',
                  color: darkMode ? '#0A2540' : '#ffffff',
                  '&:hover': {
                    bgcolor: darkMode ? '#8ab4de' : '#0d0580',
                  },
                }}
              >
                Create account
              </Button>
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
              <a href="#" className="text-[#10069f] dark:text-[#9fc2e9] hover:underline">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#" className="text-[#10069f] dark:text-[#9fc2e9] hover:underline">
                Privacy Policy
              </a>
            </p>
          </div>
        </div>
      </div>
    </CssVarsProvider>
  );
}
