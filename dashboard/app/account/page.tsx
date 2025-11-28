'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  LuUser,
  LuMail,
  LuBuilding,
  LuKey,
  LuCopy,
  LuCheck,
  LuLogOut,
  LuCalendar,
  LuDatabase,
  LuActivity,
  LuChartBar,
} from 'react-icons/lu';
import CircularProgress from '@mui/material/CircularProgress';
import { cn } from '@/lib/utils';

export default function AccountPage() {
  const router = useRouter();
  const { user, projects, stats, loading, logout } = useAuth();
  const [copied, setCopied] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const copyApiKey = async () => {
    if (user?.apiKey) {
      await navigator.clipboard.writeText(user.apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <CircularProgress />
      </div>
    );
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[22px] font-semibold text-[#0A2540] dark:text-[#E8ECF1]">
            Account
          </h1>
          <p className="text-[15px] text-[#596780] dark:text-[#afb6bf] mt-1">
            Manage your account and API access
          </p>
        </div>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-[14px] font-medium border border-[#E3E8EE] dark:border-[#1D2530] text-[#596780] hover:text-red-600 hover:border-red-300 dark:hover:border-red-800 transition-colors"
        >
          {loggingOut ? (
            <CircularProgress size={16} sx={{ color: 'inherit' }} />
          ) : (
            <LuLogOut className="w-4 h-4" />
          )}
          Sign Out
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Card */}
        <div className="bg-white dark:bg-[#151B24] rounded-xl border border-[#E3E8EE] dark:border-[#1D2530] p-6">
          <h2 className="text-[16px] font-semibold text-[#0A2540] dark:text-[#E8ECF1] mb-4">
            Profile
          </h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#10069F] flex items-center justify-center">
                <LuUser className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-[14px] font-medium text-[#0A2540] dark:text-[#E8ECF1]">
                  {user.name}
                </p>
                <p className="text-[13px] text-[#596780] dark:text-[#afb6bf]">
                  Account holder
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-[#E3E8EE] dark:border-[#1D2530]">
              <div className="flex items-center gap-3">
                <LuMail className="w-4 h-4 text-[#596780]" />
                <span className="text-[14px] text-[#0A2540] dark:text-[#E8ECF1]">
                  {user.email}
                </span>
              </div>
              {user.company && (
                <div className="flex items-center gap-3">
                  <LuBuilding className="w-4 h-4 text-[#596780]" />
                  <span className="text-[14px] text-[#0A2540] dark:text-[#E8ECF1]">
                    {user.company}
                  </span>
                </div>
              )}
              {user.createdAt && (
                <div className="flex items-center gap-3">
                  <LuCalendar className="w-4 h-4 text-[#596780]" />
                  <span className="text-[14px] text-[#596780] dark:text-[#afb6bf]">
                    Member since {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* API Key Card */}
        <div className="bg-white dark:bg-[#151B24] rounded-xl border border-[#E3E8EE] dark:border-[#1D2530] p-6">
          <h2 className="text-[16px] font-semibold text-[#0A2540] dark:text-[#E8ECF1] mb-4">
            API Key
          </h2>
          <p className="text-[13px] text-[#596780] dark:text-[#afb6bf] mb-4">
            Use this key to authenticate your notebook or SDK requests
          </p>

          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <LuKey className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#596780]" />
              <input
                type="text"
                readOnly
                value={user.apiKey}
                className="w-full pl-10 pr-4 py-2.5 text-[13px] font-mono border border-[#E3E8EE] dark:border-[#1D2530] rounded-lg bg-[#F6F9FC] dark:bg-[#0A0E14] text-[#0A2540] dark:text-[#E8ECF1]"
              />
            </div>
            <button
              onClick={copyApiKey}
              className={cn(
                "flex items-center justify-center w-10 h-10 rounded-lg border transition-colors",
                copied
                  ? "border-green-300 bg-green-50 dark:bg-green-900/20 dark:border-green-800"
                  : "border-[#E3E8EE] dark:border-[#1D2530] hover:bg-[#F6F9FC] dark:hover:bg-[#1D2530]"
              )}
            >
              {copied ? (
                <LuCheck className="w-4 h-4 text-green-600" />
              ) : (
                <LuCopy className="w-4 h-4 text-[#596780]" />
              )}
            </button>
          </div>

          <div className="mt-4 p-3 bg-[#F6F9FC] dark:bg-[#0A0E14] rounded-lg">
            <p className="text-[12px] font-medium text-[#596780] dark:text-[#afb6bf] uppercase tracking-wider mb-2">
              Usage in Notebook
            </p>
            <pre className="text-[12px] font-mono text-[#0A2540] dark:text-[#E8ECF1] overflow-x-auto">
{`# Add header to your tracer
headers = {
  "X-API-Key": "${user.apiKey}"
}`}
            </pre>
          </div>
        </div>

        {/* Stats Card */}
        {stats && (
          <div className="bg-white dark:bg-[#151B24] rounded-xl border border-[#E3E8EE] dark:border-[#1D2530] p-6">
            <h2 className="text-[16px] font-semibold text-[#0A2540] dark:text-[#E8ECF1] mb-4">
              Usage Statistics
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-[#F6F9FC] dark:bg-[#0A0E14] rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <LuDatabase className="w-4 h-4 text-[#10069F] dark:text-[#9fc2e9]" />
                  <span className="text-[12px] font-medium text-[#596780] dark:text-[#afb6bf] uppercase">
                    Total Traces
                  </span>
                </div>
                <p className="text-[24px] font-semibold text-[#0A2540] dark:text-[#E8ECF1]">
                  {stats.totalTraces.toLocaleString()}
                </p>
              </div>

              <div className="p-4 bg-[#F6F9FC] dark:bg-[#0A0E14] rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <LuActivity className="w-4 h-4 text-[#10069F] dark:text-[#9fc2e9]" />
                  <span className="text-[12px] font-medium text-[#596780] dark:text-[#afb6bf] uppercase">
                    Tokens Used
                  </span>
                </div>
                <p className="text-[24px] font-semibold text-[#0A2540] dark:text-[#E8ECF1]">
                  {stats.totalTokens.toLocaleString()}
                </p>
              </div>

              <div className="col-span-2 p-4 bg-[#F6F9FC] dark:bg-[#0A0E14] rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <LuChartBar className="w-4 h-4 text-[#10069F] dark:text-[#9fc2e9]" />
                  <span className="text-[12px] font-medium text-[#596780] dark:text-[#afb6bf] uppercase">
                    Evaluation Status
                  </span>
                </div>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="text-[13px] text-[#0A2540] dark:text-[#E8ECF1]">
                      Pass: {stats.byStatus.pass}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <span className="text-[13px] text-[#0A2540] dark:text-[#E8ECF1]">
                      Fail: {stats.byStatus.fail}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <span className="text-[13px] text-[#0A2540] dark:text-[#E8ECF1]">
                      Review: {stats.byStatus.review}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gray-400" />
                    <span className="text-[13px] text-[#0A2540] dark:text-[#E8ECF1]">
                      Pending: {stats.byStatus.pending}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Projects Card */}
        {projects.length > 0 && (
          <div className="bg-white dark:bg-[#151B24] rounded-xl border border-[#E3E8EE] dark:border-[#1D2530] p-6">
            <h2 className="text-[16px] font-semibold text-[#0A2540] dark:text-[#E8ECF1] mb-4">
              Projects
            </h2>
            <div className="space-y-3">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="p-3 bg-[#F6F9FC] dark:bg-[#0A0E14] rounded-lg"
                >
                  <p className="text-[14px] font-medium text-[#0A2540] dark:text-[#E8ECF1]">
                    {project.name}
                  </p>
                  {project.description && (
                    <p className="text-[13px] text-[#596780] dark:text-[#afb6bf] mt-1">
                      {project.description}
                    </p>
                  )}
                  <p className="text-[12px] text-[#596780] dark:text-[#afb6bf] mt-2">
                    Created {new Date(project.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
