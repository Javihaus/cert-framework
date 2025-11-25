'use client';

import { useState, useEffect } from 'react';
import {
  Settings,
  Key,
  Check,
  X,
  Loader2,
  AlertCircle,
  Zap,
  RefreshCw,
  Eye,
  EyeOff,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Provider = 'anthropic' | 'openai' | 'google';
type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

interface ApiConnection {
  provider: Provider;
  name: string;
  apiKey: string;
  status: ConnectionStatus;
  lastChecked?: Date;
  models?: string[];
  error?: string;
}

interface JudgeConfig {
  provider: Provider;
  model: string;
  criteria: {
    accuracy: boolean;
    relevance: boolean;
    safety: boolean;
    coherence: boolean;
  };
  confidenceThreshold: number;
}

const PROVIDER_INFO: Record<Provider, { name: string; color: string; models: string[] }> = {
  anthropic: {
    name: 'Claude API (Anthropic)',
    color: '#D97757',
    models: ['claude-sonnet-4-20250514', 'claude-opus-4-20250514', 'claude-3-5-haiku-20241022'],
  },
  openai: {
    name: 'OpenAI API',
    color: '#10A37F',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  },
  google: {
    name: 'Gemini API (Google)',
    color: '#4285F4',
    models: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-pro'],
  },
};

export default function ConfigurationPage() {
  const [connections, setConnections] = useState<ApiConnection[]>([
    { provider: 'anthropic', name: 'Claude API (Anthropic)', apiKey: '', status: 'disconnected' },
    { provider: 'openai', name: 'OpenAI API', apiKey: '', status: 'disconnected' },
    { provider: 'google', name: 'Gemini API (Google)', apiKey: '', status: 'disconnected' },
  ]);

  const [judgeConfig, setJudgeConfig] = useState<JudgeConfig>({
    provider: 'anthropic',
    model: 'claude-sonnet-4-20250514',
    criteria: {
      accuracy: true,
      relevance: true,
      safety: true,
      coherence: true,
    },
    confidenceThreshold: 0.8,
  });

  const [showKeys, setShowKeys] = useState<Record<Provider, boolean>>({
    anthropic: false,
    openai: false,
    google: false,
  });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Load saved configuration on mount
  useEffect(() => {
    const savedConnections = localStorage.getItem('cert-api-connections');
    const savedJudgeConfig = localStorage.getItem('cert-judge-config');

    if (savedConnections) {
      try {
        const parsed = JSON.parse(savedConnections);
        setConnections(parsed.map((c: ApiConnection) => ({
          ...c,
          status: c.apiKey ? 'connected' : 'disconnected',
        })));
      } catch (e) {
        console.error('Failed to load connections', e);
      }
    }

    if (savedJudgeConfig) {
      try {
        setJudgeConfig(JSON.parse(savedJudgeConfig));
      } catch (e) {
        console.error('Failed to load judge config', e);
      }
    }
  }, []);

  const updateApiKey = (provider: Provider, apiKey: string) => {
    setConnections(prev =>
      prev.map(c =>
        c.provider === provider
          ? { ...c, apiKey, status: 'disconnected' as ConnectionStatus }
          : c
      )
    );
  };

  const testConnection = async (provider: Provider) => {
    const connection = connections.find(c => c.provider === provider);
    if (!connection?.apiKey) return;

    setConnections(prev =>
      prev.map(c =>
        c.provider === provider ? { ...c, status: 'connecting' as ConnectionStatus } : c
      )
    );

    try {
      const response = await fetch('/api/config/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, apiKey: connection.apiKey }),
      });

      const data = await response.json();

      setConnections(prev =>
        prev.map(c =>
          c.provider === provider
            ? {
                ...c,
                status: data.success ? 'connected' : 'error',
                lastChecked: new Date(),
                models: data.models,
                error: data.error,
              }
            : c
        )
      );
    } catch (error) {
      setConnections(prev =>
        prev.map(c =>
          c.provider === provider
            ? {
                ...c,
                status: 'error',
                error: 'Failed to connect. Check your API key and try again.',
              }
            : c
        )
      );
    }
  };

  const testAllConnections = async () => {
    const configured = connections.filter(c => c.apiKey);
    await Promise.all(configured.map(c => testConnection(c.provider)));
  };

  const saveConfiguration = async () => {
    setSaving(true);

    // Save to localStorage for now (in production, this would go to backend)
    localStorage.setItem('cert-api-connections', JSON.stringify(connections));
    localStorage.setItem('cert-judge-config', JSON.stringify(judgeConfig));

    // Also try to save to backend
    try {
      await fetch('/api/config/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connections, judgeConfig }),
      });
    } catch (e) {
      console.log('Backend save skipped (not configured)');
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const connectedProviders = connections.filter(c => c.status === 'connected');
  const hasActiveConnection = connectedProviders.length > 0;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white flex items-center gap-3">
            <Settings className="w-7 h-7 text-blue-600" />
            Configuration
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            Connect your LLM providers and configure the evaluation judge
          </p>
        </div>
        <button
          onClick={saveConfiguration}
          disabled={saving}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all",
            saved
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
              : "bg-blue-600 text-white hover:bg-blue-700"
          )}
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : saved ? (
            <Check className="w-4 h-4" />
          ) : null}
          {saved ? 'Saved!' : 'Save Configuration'}
        </button>
      </div>

      {/* Status Banner */}
      {!hasActiveConnection && (
        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-800 dark:text-amber-300">
              No API connections configured
            </p>
            <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
              Add at least one API key below to start evaluating your LLM outputs.
            </p>
          </div>
        </div>
      )}

      {/* API Connections */}
      <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Key className="w-5 h-5 text-zinc-400" />
            <h2 className="font-semibold text-zinc-900 dark:text-white">API Connections</h2>
          </div>
          <button
            onClick={testAllConnections}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Test All
          </button>
        </div>

        <div className="divide-y divide-zinc-200 dark:divide-zinc-700">
          {connections.map((connection) => {
            const info = PROVIDER_INFO[connection.provider];
            const isConnected = connection.status === 'connected';
            const isConnecting = connection.status === 'connecting';
            const hasError = connection.status === 'error';

            return (
              <div key={connection.provider} className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${info.color}20` }}
                    >
                      <span
                        className="font-bold text-lg"
                        style={{ color: info.color }}
                      >
                        {connection.provider[0].toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-medium text-zinc-900 dark:text-white">
                        {info.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        {isConnected && (
                          <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                            Connected
                          </span>
                        )}
                        {isConnecting && (
                          <span className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Connecting...
                          </span>
                        )}
                        {hasError && (
                          <span className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
                            <X className="w-3 h-3" />
                            Error
                          </span>
                        )}
                        {connection.status === 'disconnected' && !connection.apiKey && (
                          <span className="text-xs text-zinc-400">Not configured</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "px-2.5 py-1 rounded-full text-xs font-medium",
                      isConnected
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
                        : "bg-zinc-100 text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400"
                    )}
                  >
                    {isConnected ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="mt-4 flex gap-3">
                  <div className="flex-1 relative">
                    <input
                      type={showKeys[connection.provider] ? 'text' : 'password'}
                      value={connection.apiKey}
                      onChange={(e) => updateApiKey(connection.provider, e.target.value)}
                      placeholder={`Enter ${info.name} API key`}
                      className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-600 rounded-lg text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                    />
                    <button
                      onClick={() =>
                        setShowKeys(prev => ({
                          ...prev,
                          [connection.provider]: !prev[connection.provider],
                        }))
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                    >
                      {showKeys[connection.provider] ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <button
                    onClick={() => testConnection(connection.provider)}
                    disabled={!connection.apiKey || isConnecting}
                    className={cn(
                      "px-4 py-2.5 rounded-lg text-sm font-medium transition-colors",
                      connection.apiKey && !isConnecting
                        ? "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-600 dark:hover:bg-zinc-500"
                        : "bg-zinc-100 text-zinc-400 dark:bg-zinc-700 dark:text-zinc-500 cursor-not-allowed"
                    )}
                  >
                    {isConnecting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Connect'
                    )}
                  </button>
                </div>

                {hasError && connection.error && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                    {connection.error}
                  </p>
                )}

                {isConnected && connection.models && (
                  <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                    Available models: {connection.models.join(', ')}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* LLM Judge Configuration */}
      <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-700 flex items-center gap-3">
          <Zap className="w-5 h-5 text-purple-500" />
          <h2 className="font-semibold text-zinc-900 dark:text-white">LLM Judge Settings</h2>
        </div>

        <div className="p-6 space-y-6">
          {/* Provider Selection */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Judge Provider
            </label>
            <div className="space-y-2">
              {(['anthropic', 'openai', 'google'] as Provider[]).map((provider) => {
                const info = PROVIDER_INFO[provider];
                const connection = connections.find(c => c.provider === provider);
                const isConnected = connection?.status === 'connected';
                const isSelected = judgeConfig.provider === provider;

                return (
                  <label
                    key={provider}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                      isSelected
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-500/10"
                        : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600",
                      !isConnected && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <input
                      type="radio"
                      name="judgeProvider"
                      value={provider}
                      checked={isSelected}
                      disabled={!isConnected}
                      onChange={(e) =>
                        setJudgeConfig(prev => ({
                          ...prev,
                          provider: e.target.value as Provider,
                          model: PROVIDER_INFO[e.target.value as Provider].models[0],
                        }))
                      }
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="flex-1 text-sm text-zinc-900 dark:text-white">
                      {info.name}
                    </span>
                    {provider === 'anthropic' && isConnected && (
                      <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                        Recommended
                      </span>
                    )}
                    {!isConnected && (
                      <span className="text-xs text-zinc-400">Not connected</span>
                    )}
                  </label>
                );
              })}
            </div>
          </div>

          {/* Model Selection */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Judge Model
            </label>
            <select
              value={judgeConfig.model}
              onChange={(e) =>
                setJudgeConfig(prev => ({ ...prev, model: e.target.value }))
              }
              className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-600 rounded-lg text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {PROVIDER_INFO[judgeConfig.provider].models.map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>
          </div>

          {/* Evaluation Criteria */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Evaluation Criteria
            </label>
            <div className="space-y-2">
              {[
                { key: 'accuracy', label: 'Accuracy', desc: 'Is the response factually correct?' },
                { key: 'relevance', label: 'Relevance', desc: 'Does it answer the question?' },
                { key: 'safety', label: 'Safety', desc: 'Are there harmful outputs?' },
                { key: 'coherence', label: 'Coherence', desc: 'Is the response well-structured?' },
              ].map((criterion) => (
                <label
                  key={criterion.key}
                  className="flex items-center gap-3 p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-600"
                >
                  <input
                    type="checkbox"
                    checked={judgeConfig.criteria[criterion.key as keyof typeof judgeConfig.criteria]}
                    onChange={(e) =>
                      setJudgeConfig(prev => ({
                        ...prev,
                        criteria: {
                          ...prev.criteria,
                          [criterion.key]: e.target.checked,
                        },
                      }))
                    }
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <div className="flex-1">
                    <span className="text-sm text-zinc-900 dark:text-white">
                      {criterion.label}
                    </span>
                    <span className="text-xs text-zinc-500 ml-2">
                      - {criterion.desc}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Confidence Threshold */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Confidence Threshold
              </label>
              <span className="text-sm font-mono text-zinc-900 dark:text-white">
                {judgeConfig.confidenceThreshold.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={judgeConfig.confidenceThreshold}
              onChange={(e) =>
                setJudgeConfig(prev => ({
                  ...prev,
                  confidenceThreshold: parseFloat(e.target.value),
                }))
              }
              className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex items-start gap-2 mt-3 p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
              <Info className="w-4 h-4 text-zinc-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Traces with scores below this threshold will be sent to the Human Review Queue for manual verification.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Status */}
      <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-6">
        <h3 className="font-medium text-zinc-900 dark:text-white mb-4">Configuration Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className={cn(
              "w-2 h-2 rounded-full",
              hasActiveConnection ? "bg-emerald-500" : "bg-zinc-300"
            )} />
            <span className="text-zinc-600 dark:text-zinc-400">
              {connectedProviders.length} of 3 providers connected
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            <span className="text-zinc-600 dark:text-zinc-400">
              Judge: {PROVIDER_INFO[judgeConfig.provider].name.split(' ')[0]}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-zinc-600 dark:text-zinc-400">
              Threshold: {(judgeConfig.confidenceThreshold * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
