'use client';

import { useState, useEffect } from 'react';
import {
  Settings,
  DollarSign,
  Check,
  Loader2,
  Zap,
  Info,
  Plus,
  Trash2,
  Sparkles,
  Sliders,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModelPricing {
  id: string;
  vendor: string;
  model: string;
  inputPricePerMillion: number;
  outputPricePerMillion: number;
}

interface JudgeConfig {
  apiKey: string;
  provider: 'anthropic' | 'openai' | 'google';
  model: string;
  passThreshold: number;
}

interface AutoEvalConfig {
  enabled: boolean;
  semanticWeight: number;  // 0-100, default 30
  nliWeight: number;       // 0-100, default 70
  passThreshold: number;   // 0-10 scale
}

// Default pricing (per 1M tokens)
const DEFAULT_PRICING: ModelPricing[] = [
  { id: '1', vendor: 'openai', model: 'gpt-4o', inputPricePerMillion: 5, outputPricePerMillion: 15 },
  { id: '2', vendor: 'openai', model: 'gpt-4o-mini', inputPricePerMillion: 0.15, outputPricePerMillion: 0.6 },
  { id: '3', vendor: 'openai', model: 'gpt-4-turbo', inputPricePerMillion: 10, outputPricePerMillion: 30 },
  { id: '4', vendor: 'anthropic', model: 'claude-sonnet-4-5-20250929', inputPricePerMillion: 3, outputPricePerMillion: 15 },
  { id: '5', vendor: 'anthropic', model: 'claude-3-opus', inputPricePerMillion: 15, outputPricePerMillion: 75 },
  { id: '6', vendor: 'anthropic', model: 'claude-3-haiku', inputPricePerMillion: 0.25, outputPricePerMillion: 1.25 },
  { id: '7', vendor: 'google', model: 'gemini-1.5-pro', inputPricePerMillion: 3.5, outputPricePerMillion: 10.5 },
  { id: '8', vendor: 'google', model: 'gemini-1.5-flash', inputPricePerMillion: 0.075, outputPricePerMillion: 0.3 },
];

const JUDGE_MODELS = {
  anthropic: ['claude-sonnet-4-5-20250929', 'claude-3-opus', 'claude-3-haiku'],
  openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'],
  google: ['gemini-1.5-pro', 'gemini-1.5-flash'],
};

export default function ConfigurationPage() {
  const [pricing, setPricing] = useState<ModelPricing[]>(DEFAULT_PRICING);
  const [judgeConfig, setJudgeConfig] = useState<JudgeConfig>({
    apiKey: '',
    provider: 'anthropic',
    model: 'claude-sonnet-4-5-20250929',
    passThreshold: 7,
  });
  const [autoEvalConfig, setAutoEvalConfig] = useState<AutoEvalConfig>({
    enabled: true,
    semanticWeight: 30,
    nliWeight: 70,
    passThreshold: 7,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  // Load saved configuration
  useEffect(() => {
    const savedPricing = localStorage.getItem('cert-model-pricing');
    const savedJudge = localStorage.getItem('cert-judge-config-v2');
    const savedAutoEval = localStorage.getItem('cert-auto-eval-config');

    if (savedPricing) {
      try {
        setPricing(JSON.parse(savedPricing));
      } catch (e) {
        console.error('Failed to load pricing', e);
      }
    }

    if (savedJudge) {
      try {
        setJudgeConfig(JSON.parse(savedJudge));
      } catch (e) {
        console.error('Failed to load judge config', e);
      }
    }

    if (savedAutoEval) {
      try {
        setAutoEvalConfig(JSON.parse(savedAutoEval));
      } catch (e) {
        console.error('Failed to load auto-eval config', e);
      }
    }
  }, []);

  const saveConfiguration = async () => {
    setSaving(true);
    localStorage.setItem('cert-model-pricing', JSON.stringify(pricing));
    localStorage.setItem('cert-judge-config-v2', JSON.stringify(judgeConfig));
    localStorage.setItem('cert-auto-eval-config', JSON.stringify(autoEvalConfig));

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  // Normalize weights to sum to 100
  const normalizeWeights = (semantic: number, nli: number) => {
    const total = semantic + nli;
    if (total === 0) return { semantic: 50, nli: 50 };
    return {
      semantic: Math.round((semantic / total) * 100),
      nli: Math.round((nli / total) * 100),
    };
  };

  const updatePricing = (id: string, field: keyof ModelPricing, value: string | number) => {
    setPricing(prev => prev.map(p =>
      p.id === id ? { ...p, [field]: value } : p
    ));
  };

  const addPricing = () => {
    const newId = Date.now().toString();
    setPricing(prev => [...prev, {
      id: newId,
      vendor: '',
      model: '',
      inputPricePerMillion: 0,
      outputPricePerMillion: 0,
    }]);
  };

  const removePricing = (id: string) => {
    setPricing(prev => prev.filter(p => p.id !== id));
  };

  const resetToDefaults = () => {
    setPricing(DEFAULT_PRICING);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white flex items-center gap-3">
            <Settings className="w-7 h-7 text-[#3C6098]" />
            Configuration
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            Configure model pricing and evaluation settings
          </p>
        </div>
        <button
          onClick={saveConfiguration}
          disabled={saving}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all",
            saved
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
              : "bg-[#3C6098] text-white hover:bg-[#3C6098]/90"
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

      {/* Model Pricing */}
      <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <DollarSign className="w-5 h-5 text-yellow-500" />
            <h2 className="font-semibold text-zinc-900 dark:text-white">Model Pricing</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={resetToDefaults}
              className="px-3 py-1.5 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
            >
              Reset to Defaults
            </button>
            <button
              onClick={addPricing}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-[#3C6098] text-white rounded-lg hover:bg-[#3C6098]/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Model
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-50 dark:bg-zinc-900">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Vendor
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Model
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Input ($/1M tokens)
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Output ($/1M tokens)
                </th>
                <th className="px-4 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
              {pricing.map((row) => (
                <tr key={row.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-700/50">
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      value={row.vendor}
                      onChange={(e) => updatePricing(row.id, 'vendor', e.target.value)}
                      placeholder="e.g., openai"
                      className="w-full px-2 py-1.5 bg-transparent border border-zinc-200 dark:border-zinc-600 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#3C6098]"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      value={row.model}
                      onChange={(e) => updatePricing(row.id, 'model', e.target.value)}
                      placeholder="e.g., gpt-4o"
                      className="w-full px-2 py-1.5 bg-transparent border border-zinc-200 dark:border-zinc-600 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#3C6098]"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      step="0.01"
                      value={row.inputPricePerMillion}
                      onChange={(e) => updatePricing(row.id, 'inputPricePerMillion', parseFloat(e.target.value) || 0)}
                      className="w-24 px-2 py-1.5 bg-transparent border border-zinc-200 dark:border-zinc-600 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#3C6098]"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      step="0.01"
                      value={row.outputPricePerMillion}
                      onChange={(e) => updatePricing(row.id, 'outputPricePerMillion', parseFloat(e.target.value) || 0)}
                      className="w-24 px-2 py-1.5 bg-transparent border border-zinc-200 dark:border-zinc-600 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#3C6098]"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => removePricing(row.id)}
                      className="p-1.5 text-zinc-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-3 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-700">
          <div className="flex items-start gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p>
              Pricing is used to calculate costs in the Cost Analysis page.
              Prices are per 1 million tokens. Update these values when providers change their pricing.
            </p>
          </div>
        </div>
      </div>

      {/* Automatic Evaluation Configuration */}
      <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-teal-500" />
            <h2 className="font-semibold text-zinc-900 dark:text-white">Automatic Evaluation (CERT Core)</h2>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              {autoEvalConfig.enabled ? 'Enabled' : 'Disabled'}
            </span>
            <button
              onClick={() => setAutoEvalConfig(prev => ({ ...prev, enabled: !prev.enabled }))}
              className={cn(
                "relative w-11 h-6 rounded-full transition-colors",
                autoEvalConfig.enabled ? "bg-teal-500" : "bg-zinc-300 dark:bg-zinc-600"
              )}
            >
              <span
                className={cn(
                  "absolute top-1 w-4 h-4 bg-white rounded-full transition-transform",
                  autoEvalConfig.enabled ? "left-6" : "left-1"
                )}
              />
            </button>
          </label>
        </div>

        <div className={cn("p-6 space-y-6", !autoEvalConfig.enabled && "opacity-50 pointer-events-none")}>
          {/* No API Key Info */}
          <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg border border-emerald-200 dark:border-emerald-500/30">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                No API Key Required - Fully Automatic
              </span>
            </div>
            <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1 ml-6">
              Uses HuggingFace Inference API (free tier) with algorithmic fallback for reliability
            </p>
          </div>

          {/* Weight Sliders */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <Sliders className="w-4 h-4 text-zinc-400" />
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Evaluation Weights
              </label>
            </div>

            {/* Semantic Similarity Weight */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">Semantic Similarity</span>
                <span className="text-sm font-mono text-zinc-900 dark:text-white">
                  {autoEvalConfig.semanticWeight}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={autoEvalConfig.semanticWeight}
                onChange={(e) => {
                  const semantic = parseInt(e.target.value);
                  setAutoEvalConfig(prev => ({
                    ...prev,
                    semanticWeight: semantic,
                    nliWeight: 100 - semantic,
                  }));
                }}
                className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-teal-500"
              />
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Measures cosine similarity between input/output embeddings. Higher = more weight on semantic match.
              </p>
            </div>

            {/* NLI Weight */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">NLI (Entailment) Score</span>
                <span className="text-sm font-mono text-zinc-900 dark:text-white">
                  {autoEvalConfig.nliWeight}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={autoEvalConfig.nliWeight}
                onChange={(e) => {
                  const nli = parseInt(e.target.value);
                  setAutoEvalConfig(prev => ({
                    ...prev,
                    nliWeight: nli,
                    semanticWeight: 100 - nli,
                  }));
                }}
                className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-teal-500"
              />
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Measures logical entailment (does output follow from input?). Higher = more weight on logical consistency.
              </p>
            </div>

            {/* Visual representation */}
            <div className="flex h-3 rounded-full overflow-hidden bg-zinc-200 dark:bg-zinc-700">
              <div
                className="bg-blue-500 transition-all"
                style={{ width: `${autoEvalConfig.semanticWeight}%` }}
              />
              <div
                className="bg-purple-500 transition-all"
                style={{ width: `${autoEvalConfig.nliWeight}%` }}
              />
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-blue-500">Semantic ({autoEvalConfig.semanticWeight}%)</span>
              <span className="text-purple-500">NLI ({autoEvalConfig.nliWeight}%)</span>
            </div>
          </div>

          {/* Pass Threshold */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Auto-Eval Pass Threshold (0-10)
              </label>
              <span className="text-sm font-mono text-zinc-900 dark:text-white">
                {autoEvalConfig.passThreshold}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              step="0.5"
              value={autoEvalConfig.passThreshold}
              onChange={(e) => setAutoEvalConfig(prev => ({ ...prev, passThreshold: parseFloat(e.target.value) }))}
              className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-teal-500"
            />
            <div className="flex justify-between mt-1 text-xs text-zinc-400">
              <span>0 (Fail all)</span>
              <span>5 (Moderate)</span>
              <span>10 (Pass all)</span>
            </div>
          </div>

          {/* Info Box */}
          <div className="p-4 bg-teal-50 dark:bg-teal-500/10 rounded-lg border border-teal-200 dark:border-teal-500/30">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-teal-600 dark:text-teal-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-teal-900 dark:text-teal-300 text-sm">How CERT Auto-Evaluation Works</h4>
                <p className="text-xs text-teal-700 dark:text-teal-400 mt-1">
                  CERT automatically evaluates LLM traces using HuggingFace Inference API (free tier):
                </p>
                <ul className="text-xs text-teal-700 dark:text-teal-400 mt-2 space-y-1 list-disc list-inside">
                  <li><strong>Semantic Similarity:</strong> all-MiniLM-L6-v2 embeddings + cosine similarity</li>
                  <li><strong>NLI Score:</strong> DeBERTa-v3-small for entailment/contradiction detection</li>
                  <li><strong>Fallback:</strong> Algorithmic methods (n-gram overlap, keyword analysis) if API unavailable</li>
                </ul>
                <p className="text-xs text-teal-700 dark:text-teal-400 mt-2">
                  Final score = ({autoEvalConfig.semanticWeight}% × Semantic) + ({autoEvalConfig.nliWeight}% × NLI)
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* LLM Judge Configuration */}
      <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-700 flex items-center gap-3">
          <Zap className="w-5 h-5 text-purple-500" />
          <h2 className="font-semibold text-zinc-900 dark:text-white">LLM Judge Settings</h2>
        </div>

        <div className="p-6 space-y-6">
          {/* API Key for Judge */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Judge API Key
            </label>
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={judgeConfig.apiKey}
                  onChange={(e) => setJudgeConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                  placeholder="Enter API key for the judge model"
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3C6098]"
                />
              </div>
              <button
                onClick={() => setShowApiKey(!showApiKey)}
                className="px-4 py-2.5 text-sm text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-600 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700"
              >
                {showApiKey ? 'Hide' : 'Show'}
              </button>
            </div>
            <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
              This API key is used for LLM-as-judge evaluations. It stays in your browser and is never sent to our servers.
            </p>
          </div>

          {/* Provider Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Judge Provider
              </label>
              <select
                value={judgeConfig.provider}
                onChange={(e) => {
                  const provider = e.target.value as 'anthropic' | 'openai' | 'google';
                  setJudgeConfig(prev => ({
                    ...prev,
                    provider,
                    model: JUDGE_MODELS[provider][0],
                  }));
                }}
                className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3C6098]"
              >
                <option value="anthropic">Anthropic (Claude)</option>
                <option value="openai">OpenAI (GPT)</option>
                <option value="google">Google (Gemini)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Judge Model
              </label>
              <select
                value={judgeConfig.model}
                onChange={(e) => setJudgeConfig(prev => ({ ...prev, model: e.target.value }))}
                className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3C6098]"
              >
                {JUDGE_MODELS[judgeConfig.provider].map((model) => (
                  <option key={model} value={model}>{model}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Pass Threshold */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Pass Threshold (0-10)
              </label>
              <span className="text-sm font-mono text-zinc-900 dark:text-white">
                {judgeConfig.passThreshold}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              step="1"
              value={judgeConfig.passThreshold}
              onChange={(e) => setJudgeConfig(prev => ({ ...prev, passThreshold: parseInt(e.target.value) }))}
              className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-[#3C6098]"
            />
            <div className="flex justify-between mt-1 text-xs text-zinc-400">
              <span>0 (Fail)</span>
              <span>5 (Borderline)</span>
              <span>10 (Perfect)</span>
            </div>
            <div className="flex items-start gap-2 mt-3 p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
              <Info className="w-4 h-4 text-zinc-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Traces with scores below {judgeConfig.passThreshold} will be marked as "Fail".
                Scores ≥ {judgeConfig.passThreshold} will be marked as "Pass".
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-6">
        <h3 className="font-medium text-zinc-900 dark:text-white mb-4">Configuration Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-yellow-500" />
            <span className="text-zinc-600 dark:text-zinc-400">
              {pricing.length} models with pricing
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn(
              "w-2 h-2 rounded-full",
              autoEvalConfig.enabled ? "bg-teal-500" : "bg-zinc-300"
            )} />
            <span className="text-zinc-600 dark:text-zinc-400">
              Auto-Eval: {autoEvalConfig.enabled
                ? `${autoEvalConfig.semanticWeight}% semantic, ${autoEvalConfig.nliWeight}% NLI (HuggingFace)`
                : 'Disabled'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn(
              "w-2 h-2 rounded-full",
              judgeConfig.apiKey ? "bg-purple-500" : "bg-zinc-300"
            )} />
            <span className="text-zinc-600 dark:text-zinc-400">
              LLM Judge: {judgeConfig.apiKey ? `${judgeConfig.provider}/${judgeConfig.model}` : 'Not configured'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#3C6098]" />
            <span className="text-zinc-600 dark:text-zinc-400">
              Thresholds: Auto ≥{autoEvalConfig.passThreshold} / Judge ≥{judgeConfig.passThreshold}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
