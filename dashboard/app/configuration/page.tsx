'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  DollarSign,
  Check,
  Zap,
  Sliders,
  User,
  Shield,
  FileText,
  Database,
  Bell,
  Key,
  HelpCircle,
  X,
} from 'lucide-react';
import CircularProgress from '@mui/material/CircularProgress';
import Switch from '@mui/material/Switch';
import Slider from '@mui/material/Slider';
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
  semanticWeight: number;
  nliWeight: number;
  passThreshold: number;
}

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

interface ConfigItemProps {
  icon: React.ElementType;
  title: string;
  description: string;
  href?: string;
  onClick?: () => void;
}

function ConfigItem({ icon: Icon, title, description, href, onClick }: ConfigItemProps) {
  const content = (
    <div className="flex items-start gap-3 group cursor-pointer">
      <Icon className="w-5 h-5 text-[#10069F] dark:text-[#9fc2e9] mt-0.5 flex-shrink-0" />
      <div>
        <h3 className="text-[14px] font-medium text-[#10069F] dark:text-[#7ea0bf] group-hover:text-[#2a3759] dark:group-hover:text-[#c9d4d8] transition-colors">
          {title}
        </h3>
        <p className="text-[13px] text-[#596780] dark:text-[#afb6bf] leading-relaxed mt-0.5">
          {description}
        </p>
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return <button onClick={onClick} className="text-left w-full">{content}</button>;
}

interface ConfigPanelProps {
  title: string;
  onClose: () => void;
  wide?: boolean;
  children: React.ReactNode;
}

function ConfigPanel({ title, onClose, wide, children }: ConfigPanelProps) {
  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      <div className={cn(
        "fixed right-0 top-0 h-full bg-white dark:bg-[#151B24] shadow-lg z-50 overflow-y-auto",
        wide ? "w-[600px]" : "w-[400px]"
      )}>
        <div className="sticky top-0 bg-white dark:bg-[#151B24] border-b border-[#10069F] px-6 py-4 flex items-center justify-between">
          <h3 className="text-[16px] font-semibold text-[#0A2540] dark:text-[#E8ECF1]">{title}</h3>
          <button onClick={onClose} className="text-[#596780] hover:text-[#0A2540] dark:hover:text-[#E8ECF1]">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </>
  );
}

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
  const [showAutoEvalPanel, setShowAutoEvalPanel] = useState(false);
  const [showJudgePanel, setShowJudgePanel] = useState(false);
  const [showPricingPanel, setShowPricingPanel] = useState(false);

  useEffect(() => {
    const savedPricing = localStorage.getItem('cert-model-pricing');
    const savedJudge = localStorage.getItem('cert-judge-config-v2');
    const savedAutoEval = localStorage.getItem('cert-auto-eval-config');
    if (savedPricing) { try { setPricing(JSON.parse(savedPricing)); } catch (e) { console.error(e); } }
    if (savedJudge) { try { setJudgeConfig(JSON.parse(savedJudge)); } catch (e) { console.error(e); } }
    if (savedAutoEval) { try { setAutoEvalConfig(JSON.parse(savedAutoEval)); } catch (e) { console.error(e); } }
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

  return (
    <div className="max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-[22px] font-semibold text-[#0A2540] dark:text-[#E8ECF1]">
          Configuration
        </h1>
        <button
          onClick={saveConfiguration}
          disabled={saving}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-[14px] font-medium transition-all",
            saved
              ? "bg-[#D4EDDA] text-[#228B22] dark:bg-[rgba(48,177,48,0.2)] dark:text-[#4ADE4A]"
              : "bg-[#10069F] text-white hover:bg-[#2a3759]"
          )}
        >
          {saving ? <CircularProgress size={16} sx={{ color: 'white' }} /> : saved ? <Check className="w-4 h-4" /> : null}
          {saved ? 'Saved' : 'Save Changes'}
        </button>
      </div>

      {/* Evaluation Settings */}
      <section className="mb-10">
        <h2 className="text-[13px] font-semibold text-[#596780] dark:text-white uppercase tracking-wider mb-4">
          Evaluation Settings
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ConfigItem
            icon={Sliders}
            title="Automatic Evaluation"
            description="Configure semantic similarity and NLI weights for automatic trace evaluation."
            onClick={() => setShowAutoEvalPanel(true)}
          />
          <ConfigItem
            icon={Zap}
            title="LLM Judge"
            description="Set up API keys and model preferences for LLM-as-judge evaluations."
            onClick={() => setShowJudgePanel(true)}
          />
          <ConfigItem
            icon={DollarSign}
            title="Model Pricing"
            description="Configure token pricing for cost analysis calculations."
            onClick={() => setShowPricingPanel(true)}
          />
        </div>
      </section>

      {/* Account Settings */}
      <section className="mb-10">
        <h2 className="text-[13px] font-semibold text-[#596780] dark:text-white uppercase tracking-wider mb-4">
          Account Settings
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ConfigItem icon={User} title="Profile" description="Manage your account details and preferences." href="#" />
          <ConfigItem icon={Key} title="API Keys" description="View and manage your API keys for external integrations." href="#" />
          <ConfigItem icon={Bell} title="Notifications" description="Configure email and in-app notification preferences." href="#" />
        </div>
      </section>

      {/* Compliance & Documentation */}
      <section className="mb-10">
        <h2 className="text-[13px] font-semibold text-[#596780] dark:text-white uppercase tracking-wider mb-4">
          Compliance & Documentation
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ConfigItem icon={FileText} title="Document Templates" description="Customize templates for compliance document generation." href="#" />
          <ConfigItem icon={Shield} title="Compliance Rules" description="Configure EU AI Act compliance thresholds and requirements." href="#" />
          <ConfigItem icon={Database} title="Data Management" description="Manage trace data storage and retention policies." href="#" />
        </div>
      </section>

      {/* Help & Support */}
      <section>
        <h2 className="text-[13px] font-semibold text-[#596780] dark:text-white uppercase tracking-wider mb-4">
          Help & Support
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ConfigItem icon={HelpCircle} title="Documentation" description="Learn how to use CERT and configure your compliance workflow." href="/help" />
        </div>
      </section>

      {/* Auto Eval Panel */}
      {showAutoEvalPanel && (
        <ConfigPanel title="Automatic Evaluation" onClose={() => setShowAutoEvalPanel(false)}>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-[14px] font-medium text-[#0A2540] dark:text-[#E8ECF1]">Enable Auto-Evaluation</h4>
                <p className="text-[13px] text-[#596780] dark:text-[#afb6bf]">Automatically evaluate traces using HuggingFace models</p>
              </div>
              <Switch
                checked={autoEvalConfig.enabled}
                onChange={(e) => setAutoEvalConfig(prev => ({ ...prev, enabled: e.target.checked }))}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': { color: '#10069F' },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#10069F' },
                }}
              />
            </div>

            <div className={cn(!autoEvalConfig.enabled && "opacity-50 pointer-events-none")}>
              <label className="text-[13px] font-medium text-[#0A2540] dark:text-[#E8ECF1] block mb-3">Evaluation Weights</label>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-[13px] mb-1">
                    <span className="text-[#596780] dark:text-[#afb6bf]">Semantic Similarity</span>
                    <span className="text-[#0A2540] dark:text-[#E8ECF1] font-mono">{autoEvalConfig.semanticWeight}%</span>
                  </div>
                  <Slider
                    value={autoEvalConfig.semanticWeight}
                    onChange={(_, value) => { const s = value as number; setAutoEvalConfig(prev => ({ ...prev, semanticWeight: s, nliWeight: 100 - s })); }}
                    min={0}
                    max={100}
                    step={5}
                    sx={{ color: '#10069F' }}
                  />
                </div>
                <div>
                  <div className="flex justify-between text-[13px] mb-1">
                    <span className="text-[#596780] dark:text-[#afb6bf]">NLI (Entailment)</span>
                    <span className="text-[#0A2540] dark:text-[#E8ECF1] font-mono">{autoEvalConfig.nliWeight}%</span>
                  </div>
                  <Slider
                    value={autoEvalConfig.nliWeight}
                    onChange={(_, value) => { const n = value as number; setAutoEvalConfig(prev => ({ ...prev, nliWeight: n, semanticWeight: 100 - n })); }}
                    min={0}
                    max={100}
                    step={5}
                    sx={{ color: '#10069F' }}
                  />
                </div>
              </div>

              <div className="mt-6">
                <div className="flex justify-between text-[13px] mb-1">
                  <span className="text-[#596780] dark:text-[#afb6bf]">Pass Threshold</span>
                  <span className="text-[#0A2540] dark:text-[#E8ECF1] font-mono">{autoEvalConfig.passThreshold}/10</span>
                </div>
                <Slider
                  value={autoEvalConfig.passThreshold}
                  onChange={(_, value) => setAutoEvalConfig(prev => ({ ...prev, passThreshold: value as number }))}
                  min={0}
                  max={10}
                  step={0.5}
                  sx={{ color: '#10069F' }}
                />
              </div>
            </div>
          </div>
        </ConfigPanel>
      )}

      {/* LLM Judge Panel */}
      {showJudgePanel && (
        <ConfigPanel title="LLM Judge Settings" onClose={() => setShowJudgePanel(false)}>
          <div className="space-y-5">
            <div>
              <label className="text-[13px] font-medium text-[#0A2540] dark:text-[#E8ECF1] block mb-2">API Key</label>
              <input
                type="password" value={judgeConfig.apiKey}
                onChange={(e) => setJudgeConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                placeholder="Enter your API key"
                className="w-full px-3 py-2 text-[14px] border border-[#E3E8EE] dark:border-[#1D2530] rounded-lg bg-white dark:bg-[#151B24] focus:outline-none focus:ring-2 focus:ring-[#10069F]/20 focus:border-[#10069F]"
              />
              <p className="text-[12px] text-[#596780] dark:text-[#afb6bf] mt-1">Stored locally in your browser.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[13px] font-medium text-[#0A2540] dark:text-[#E8ECF1] block mb-2">Provider</label>
                <select
                  value={judgeConfig.provider}
                  onChange={(e) => { const p = e.target.value as 'anthropic' | 'openai' | 'google'; setJudgeConfig(prev => ({ ...prev, provider: p, model: JUDGE_MODELS[p][0] })); }}
                  className="w-full px-3 py-2 text-[14px] border border-[#E3E8EE] dark:border-[#1D2530] rounded-lg bg-white dark:bg-[#151B24] focus:outline-none focus:ring-2 focus:ring-[#10069F]/20"
                >
                  <option value="anthropic">Anthropic</option>
                  <option value="openai">OpenAI</option>
                  <option value="google">Google</option>
                </select>
              </div>
              <div>
                <label className="text-[13px] font-medium text-[#0A2540] dark:text-[#E8ECF1] block mb-2">Model</label>
                <select
                  value={judgeConfig.model}
                  onChange={(e) => setJudgeConfig(prev => ({ ...prev, model: e.target.value }))}
                  className="w-full px-3 py-2 text-[14px] border border-[#E3E8EE] dark:border-[#1D2530] rounded-lg bg-white dark:bg-[#151B24] focus:outline-none focus:ring-2 focus:ring-[#10069F]/20"
                >
                  {JUDGE_MODELS[judgeConfig.provider].map((model) => <option key={model} value={model}>{model}</option>)}
                </select>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[13px] mb-1">
                <span className="text-[#596780] dark:text-[#afb6bf]">Pass Threshold</span>
                <span className="text-[#0A2540] dark:text-[#E8ECF1] font-mono">{judgeConfig.passThreshold}/10</span>
              </div>
              <Slider
                value={judgeConfig.passThreshold}
                onChange={(_, value) => setJudgeConfig(prev => ({ ...prev, passThreshold: value as number }))}
                min={0}
                max={10}
                step={1}
                sx={{ color: '#10069F' }}
              />
            </div>
          </div>
        </ConfigPanel>
      )}

      {/* Pricing Panel */}
      {showPricingPanel && (
        <ConfigPanel title="Model Pricing" onClose={() => setShowPricingPanel(false)} wide>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-[#E3E8EE] dark:border-[#1D2530]">
                  <th className="text-left py-2 text-[11px] font-semibold text-[#596780] dark:text-[#afb6bf] uppercase tracking-wider">Vendor</th>
                  <th className="text-left py-2 text-[11px] font-semibold text-[#596780] dark:text-[#afb6bf] uppercase tracking-wider">Model</th>
                  <th className="text-left py-2 text-[11px] font-semibold text-[#596780] dark:text-[#afb6bf] uppercase tracking-wider">Input $/1M</th>
                  <th className="text-left py-2 text-[11px] font-semibold text-[#596780] dark:text-[#afb6bf] uppercase tracking-wider">Output $/1M</th>
                </tr>
              </thead>
              <tbody>
                {pricing.map((row) => (
                  <tr key={row.id} className="border-b border-[#E3E8EE] dark:border-[#1D2530]">
                    <td className="py-2">
                      <input type="text" value={row.vendor} onChange={(e) => setPricing(prev => prev.map(p => p.id === row.id ? { ...p, vendor: e.target.value } : p))}
                        className="w-full px-2 py-1 bg-transparent border-0 focus:outline-none focus:ring-1 focus:ring-[#10069F] rounded text-[#0A2540] dark:text-[#E8ECF1]" />
                    </td>
                    <td className="py-2">
                      <input type="text" value={row.model} onChange={(e) => setPricing(prev => prev.map(p => p.id === row.id ? { ...p, model: e.target.value } : p))}
                        className="w-full px-2 py-1 bg-transparent border-0 focus:outline-none focus:ring-1 focus:ring-[#10069F] rounded text-[#0A2540] dark:text-[#E8ECF1]" />
                    </td>
                    <td className="py-2">
                      <input type="number" step="0.01" value={row.inputPricePerMillion} onChange={(e) => setPricing(prev => prev.map(p => p.id === row.id ? { ...p, inputPricePerMillion: parseFloat(e.target.value) || 0 } : p))}
                        className="w-20 px-2 py-1 bg-transparent border-0 focus:outline-none focus:ring-1 focus:ring-[#10069F] rounded font-mono text-[#0A2540] dark:text-[#E8ECF1]" />
                    </td>
                    <td className="py-2">
                      <input type="number" step="0.01" value={row.outputPricePerMillion} onChange={(e) => setPricing(prev => prev.map(p => p.id === row.id ? { ...p, outputPricePerMillion: parseFloat(e.target.value) || 0 } : p))}
                        className="w-20 px-2 py-1 bg-transparent border-0 focus:outline-none focus:ring-1 focus:ring-[#10069F] rounded font-mono text-[#0A2540] dark:text-[#E8ECF1]" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex gap-3">
            <button onClick={() => { const id = Date.now().toString(); setPricing(prev => [...prev, { id, vendor: '', model: '', inputPricePerMillion: 0, outputPricePerMillion: 0 }]); }}
              className="text-[13px] text-[#10069F] dark:text-[#7ea0bf] font-medium hover:text-[#2a3759]">+ Add Model</button>
            <button onClick={() => setPricing(DEFAULT_PRICING)}
              className="text-[13px] text-[#596780] dark:text-[#afb6bf] font-medium hover:text-[#0A2540]">Reset to Defaults</button>
          </div>
        </ConfigPanel>
      )}
    </div>
  );
}
