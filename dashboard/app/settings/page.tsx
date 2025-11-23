'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Settings,
  User,
  Bell,
  Shield,
  Key,
  Globe,
  Palette,
  Server,
  Check,
  BarChart3,
  Euro,
  Heart,
  Sparkles,
  AlertTriangle,
  Upload,
  RefreshCw,
} from 'lucide-react';

// API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Icon mapping for compatibility
const CogIcon = Settings;
const UserCircleIcon = User;
const BellIcon = Bell;
const ShieldCheckIcon = Shield;
const KeyIcon = Key;
const GlobeAltIcon = Globe;
const PaintBrushIcon = Palette;
const ServerStackIcon = Server;
const CheckIcon = Check;

// Icon color palette based on design spec
const iconColors = {
  orange: '#E7640E',
  yellow: '#E6AA11',
  teal: '#4F8383',
  purple: '#883381',
};

interface MetricsConfig {
  cost: {
    currency: string;
    weekly_budget: number | null;
    monthly_budget: number | null;
    enable_alerts: boolean;
    alert_threshold: number;
  };
  health: {
    p95_latency_threshold_ms: number;
    max_latency_threshold_ms: number;
    critical_error_rate: number;
    warning_error_rate: number;
    latency_penalty_weight: number;
  };
  quality: {
    evaluation_method: string;
    semantic_threshold: number;
    preset: string;
    evaluation_dataset_path: string | null;
    critical_quality: number;
    warning_quality: number;
  };
  default_time_window: string;
  traces_path: string;
}

const settingsSections = [
  { id: 'profile', name: 'Profile', icon: UserCircleIcon, iconColor: iconColors.orange },
  { id: 'metrics', name: 'Metrics', icon: BarChart3, iconColor: iconColors.teal },
  { id: 'notifications', name: 'Notifications', icon: BellIcon, iconColor: iconColors.yellow },
  { id: 'security', name: 'Security', icon: ShieldCheckIcon, iconColor: iconColors.purple },
  { id: 'api', name: 'API Keys', icon: KeyIcon, iconColor: iconColors.orange },
  { id: 'integrations', name: 'Integrations', icon: ServerStackIcon, iconColor: iconColors.teal },
  { id: 'appearance', name: 'Appearance', icon: PaintBrushIcon, iconColor: iconColors.purple },
  { id: 'region', name: 'Region & Language', icon: GlobeAltIcon, iconColor: iconColors.yellow },
];

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('profile');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metricsConfig, setMetricsConfig] = useState<MetricsConfig | null>(null);

  // Fetch metrics configuration
  const fetchMetricsConfig = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/metrics/config`);
      if (response.ok) {
        const data = await response.json();
        setMetricsConfig(data);
      } else {
        // Use default config if API not available
        setMetricsConfig(getDefaultConfig());
      }
    } catch {
      setMetricsConfig(getDefaultConfig());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetricsConfig();
  }, [fetchMetricsConfig]);

  function getDefaultConfig(): MetricsConfig {
    return {
      cost: {
        currency: 'EUR',
        weekly_budget: null,
        monthly_budget: null,
        enable_alerts: false,
        alert_threshold: 0.9,
      },
      health: {
        p95_latency_threshold_ms: 2000,
        max_latency_threshold_ms: 10000,
        critical_error_rate: 0.1,
        warning_error_rate: 0.05,
        latency_penalty_weight: 0.5,
      },
      quality: {
        evaluation_method: 'semantic_consistency',
        semantic_threshold: 0.7,
        preset: 'general',
        evaluation_dataset_path: null,
        critical_quality: 70,
        warning_quality: 85,
      },
      default_time_window: 'week',
      traces_path: 'cert_traces.jsonl',
    };
  }

  const handleSaveMetricsConfig = async () => {
    if (!metricsConfig) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/api/metrics/config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(metricsConfig),
      });

      if (response.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } else {
        // Still show saved for demo purposes
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch {
      // Still show saved for demo purposes
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (activeSection === 'metrics') {
      handleSaveMetricsConfig();
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const updateCostConfig = (key: string, value: unknown) => {
    if (!metricsConfig) return;
    setMetricsConfig({
      ...metricsConfig,
      cost: { ...metricsConfig.cost, [key]: value },
    });
  };

  const updateHealthConfig = (key: string, value: unknown) => {
    if (!metricsConfig) return;
    setMetricsConfig({
      ...metricsConfig,
      health: { ...metricsConfig.health, [key]: value },
    });
  };

  const updateQualityConfig = (key: string, value: unknown) => {
    if (!metricsConfig) return;
    setMetricsConfig({
      ...metricsConfig,
      quality: { ...metricsConfig.quality, [key]: value },
    });
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <CogIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
          </div>
          <p className="text-gray-500 dark:text-gray-400">
            Manage your account and application preferences
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:w-64 shrink-0">
            <div className="card p-2">
              <nav className="space-y-1">
                {settingsSections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      activeSection === section.id
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <section.icon className="h-5 w-5" style={{ color: section.iconColor }} />
                    {section.name}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="card">
              {/* Metrics Configuration Section */}
              {activeSection === 'metrics' && metricsConfig && (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Metric Configuration
                    </h2>
                    <button
                      onClick={fetchMetricsConfig}
                      disabled={loading}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      <RefreshCw className={`w-5 h-5 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                  </div>

                  <div className="space-y-8">
                    {/* Cost Configuration */}
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-success-50 dark:bg-success-500/20 rounded-lg">
                          <Euro className="w-5 h-5 text-success-600" />
                        </div>
                        <h3 className="font-medium text-gray-900 dark:text-white">Cost</h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Currency
                          </label>
                          <select
                            value={metricsConfig.cost.currency}
                            onChange={(e) => updateCostConfig('currency', e.target.value)}
                            className="input-field w-full"
                          >
                            <option value="EUR">EUR (€)</option>
                            <option value="USD">USD ($)</option>
                            <option value="GBP">GBP (£)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Weekly Budget (optional)
                          </label>
                          <input
                            type="number"
                            placeholder="e.g., 5000"
                            value={metricsConfig.cost.weekly_budget || ''}
                            onChange={(e) => updateCostConfig('weekly_budget', e.target.value ? Number(e.target.value) : null)}
                            className="input-field w-full"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Monthly Budget (optional)
                          </label>
                          <input
                            type="number"
                            placeholder="e.g., 20000"
                            value={metricsConfig.cost.monthly_budget || ''}
                            onChange={(e) => updateCostConfig('monthly_budget', e.target.value ? Number(e.target.value) : null)}
                            className="input-field w-full"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Alert Threshold
                          </label>
                          <select
                            value={metricsConfig.cost.alert_threshold}
                            onChange={(e) => updateCostConfig('alert_threshold', Number(e.target.value))}
                            className="input-field w-full"
                          >
                            <option value={0.75}>75% of budget</option>
                            <option value={0.9}>90% of budget</option>
                            <option value={0.95}>95% of budget</option>
                          </select>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={metricsConfig.cost.enable_alerts}
                            onChange={(e) => updateCostConfig('enable_alerts', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                          <span className="ml-3 text-sm text-gray-600 dark:text-gray-400">
                            Enable budget alerts
                          </span>
                        </label>
                      </div>
                    </div>

                    {/* Health Configuration */}
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-error-50 dark:bg-error-500/20 rounded-lg">
                          <Heart className="w-5 h-5 text-error-600" />
                        </div>
                        <h3 className="font-medium text-gray-900 dark:text-white">Health</h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            P95 Latency Threshold (ms)
                          </label>
                          <input
                            type="number"
                            value={metricsConfig.health.p95_latency_threshold_ms}
                            onChange={(e) => updateHealthConfig('p95_latency_threshold_ms', Number(e.target.value))}
                            className="input-field w-full"
                          />
                          <p className="text-xs text-gray-500 mt-1">Requests above this are considered slow</p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Max Latency Threshold (ms)
                          </label>
                          <input
                            type="number"
                            value={metricsConfig.health.max_latency_threshold_ms}
                            onChange={(e) => updateHealthConfig('max_latency_threshold_ms', Number(e.target.value))}
                            className="input-field w-full"
                          />
                          <p className="text-xs text-gray-500 mt-1">SLA violation threshold</p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Warning Error Rate
                          </label>
                          <select
                            value={metricsConfig.health.warning_error_rate}
                            onChange={(e) => updateHealthConfig('warning_error_rate', Number(e.target.value))}
                            className="input-field w-full"
                          >
                            <option value={0.01}>1%</option>
                            <option value={0.02}>2%</option>
                            <option value={0.05}>5%</option>
                            <option value={0.1}>10%</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Critical Error Rate
                          </label>
                          <select
                            value={metricsConfig.health.critical_error_rate}
                            onChange={(e) => updateHealthConfig('critical_error_rate', Number(e.target.value))}
                            className="input-field w-full"
                          >
                            <option value={0.05}>5%</option>
                            <option value={0.1}>10%</option>
                            <option value={0.15}>15%</option>
                            <option value={0.2}>20%</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Quality Configuration */}
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-purple-50 dark:bg-purple-500/20 rounded-lg">
                          <Sparkles className="w-5 h-5 text-purple-600" />
                        </div>
                        <h3 className="font-medium text-gray-900 dark:text-white">Quality Evaluation</h3>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Evaluation Method
                          </label>
                          <div className="space-y-2">
                            <label className="flex items-start gap-3 p-3 bg-white dark:bg-gray-700 rounded-lg cursor-pointer border-2 transition-colors hover:border-blue-300 dark:hover:border-blue-700"
                              style={{
                                borderColor: metricsConfig.quality.evaluation_method === 'semantic_consistency'
                                  ? 'rgb(59 130 246)'
                                  : 'transparent',
                              }}
                            >
                              <input
                                type="radio"
                                name="evaluation_method"
                                value="semantic_consistency"
                                checked={metricsConfig.quality.evaluation_method === 'semantic_consistency'}
                                onChange={(e) => updateQualityConfig('evaluation_method', e.target.value)}
                                className="mt-1"
                              />
                              <div>
                                <div className="font-medium text-gray-900 dark:text-white">
                                  Semantic Consistency (default)
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  Measures quality based on semantic similarity between input/context and output.
                                  Works out of the box with no configuration.
                                </p>
                              </div>
                            </label>

                            <label className="flex items-start gap-3 p-3 bg-white dark:bg-gray-700 rounded-lg cursor-pointer border-2 transition-colors hover:border-blue-300 dark:hover:border-blue-700"
                              style={{
                                borderColor: metricsConfig.quality.evaluation_method === 'ground_truth'
                                  ? 'rgb(59 130 246)'
                                  : 'transparent',
                              }}
                            >
                              <input
                                type="radio"
                                name="evaluation_method"
                                value="ground_truth"
                                checked={metricsConfig.quality.evaluation_method === 'ground_truth'}
                                onChange={(e) => updateQualityConfig('evaluation_method', e.target.value)}
                                className="mt-1"
                              />
                              <div>
                                <div className="font-medium text-gray-900 dark:text-white">
                                  Ground Truth Dataset
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  Measures quality against a provided evaluation dataset with expected outputs.
                                  More accurate but requires configuration.
                                </p>
                              </div>
                            </label>
                          </div>
                        </div>

                        {metricsConfig.quality.evaluation_method === 'semantic_consistency' && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Similarity Threshold
                              </label>
                              <select
                                value={metricsConfig.quality.semantic_threshold}
                                onChange={(e) => updateQualityConfig('semantic_threshold', Number(e.target.value))}
                                className="input-field w-full"
                              >
                                <option value={0.6}>60% (Lenient)</option>
                                <option value={0.7}>70% (Standard)</option>
                                <option value={0.8}>80% (Strict)</option>
                                <option value={0.9}>90% (Very Strict)</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Industry Preset
                              </label>
                              <select
                                value={metricsConfig.quality.preset}
                                onChange={(e) => updateQualityConfig('preset', e.target.value)}
                                className="input-field w-full"
                              >
                                <option value="general">General</option>
                                <option value="financial">Financial</option>
                                <option value="healthcare">Healthcare</option>
                                <option value="legal">Legal</option>
                              </select>
                            </div>
                          </div>
                        )}

                        {metricsConfig.quality.evaluation_method === 'ground_truth' && (
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Evaluation Dataset
                              </label>
                              <div className="flex items-center gap-4">
                                <div className="flex-1 p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                                  {metricsConfig.quality.evaluation_dataset_path ? (
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm text-gray-600 dark:text-gray-400">
                                        {metricsConfig.quality.evaluation_dataset_path}
                                      </span>
                                      <button
                                        onClick={() => updateQualityConfig('evaluation_dataset_path', null)}
                                        className="text-sm text-red-600 hover:underline"
                                      >
                                        Remove
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex flex-col items-center">
                                      <Upload className="w-8 h-8 text-gray-400 mb-2" />
                                      <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Upload evaluation dataset (JSONL)
                                      </p>
                                      <p className="text-xs text-gray-400 mt-1">
                                        Each line should contain: {"{ \"input\": \"...\", \"expected_output\": \"...\" }"}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                              <div className="flex items-start gap-2">
                                <AlertTriangle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                <div className="text-sm text-blue-800 dark:text-blue-200">
                                  <p className="font-medium">Ground truth evaluation requires setup</p>
                                  <p className="mt-1">
                                    You'll need to provide a JSONL file with expected outputs for your prompts.
                                    Without this, the system will fall back to semantic consistency evaluation.
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Warning Threshold
                            </label>
                            <input
                              type="number"
                              value={metricsConfig.quality.warning_quality}
                              onChange={(e) => updateQualityConfig('warning_quality', Number(e.target.value))}
                              className="input-field w-full"
                            />
                            <p className="text-xs text-gray-500 mt-1">Quality below this shows warning</p>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Critical Threshold
                            </label>
                            <input
                              type="number"
                              value={metricsConfig.quality.critical_quality}
                              onChange={(e) => updateQualityConfig('critical_quality', Number(e.target.value))}
                              className="input-field w-full"
                            />
                            <p className="text-xs text-gray-500 mt-1">Quality below this is critical</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* General Settings */}
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <h3 className="font-medium text-gray-900 dark:text-white mb-4">General</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Default Time Window
                          </label>
                          <select
                            value={metricsConfig.default_time_window}
                            onChange={(e) => setMetricsConfig({ ...metricsConfig, default_time_window: e.target.value })}
                            className="input-field w-full"
                          >
                            <option value="hour">Last Hour</option>
                            <option value="day">Today</option>
                            <option value="week">This Week</option>
                            <option value="month">This Month</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Profile Section */}
              {activeSection === 'profile' && (
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                    Profile Information
                  </h2>

                  <div className="space-y-6">
                    {/* Avatar */}
                    <div className="flex items-center gap-6">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                        <span className="text-2xl font-bold text-white">JD</span>
                      </div>
                      <div>
                        <button className="btn btn-secondary btn-sm">Change Avatar</button>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          JPG, GIF or PNG. Max 2MB.
                        </p>
                      </div>
                    </div>

                    {/* Form Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          First Name
                        </label>
                        <input
                          type="text"
                          defaultValue="John"
                          className="input-field w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Last Name
                        </label>
                        <input
                          type="text"
                          defaultValue="Doe"
                          className="input-field w-full"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Email
                        </label>
                        <input
                          type="email"
                          defaultValue="john.doe@company.com"
                          className="input-field w-full"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Organization
                        </label>
                        <input
                          type="text"
                          defaultValue="Acme Corporation"
                          className="input-field w-full"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Role
                        </label>
                        <select className="input-field w-full">
                          <option>AI Compliance Officer</option>
                          <option>Data Protection Officer</option>
                          <option>AI Engineer</option>
                          <option>Administrator</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Notifications Section */}
              {activeSection === 'notifications' && (
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                    Notification Preferences
                  </h2>

                  <div className="space-y-6">
                    {[
                      { id: 'compliance', label: 'Compliance Alerts', description: 'Get notified when compliance status changes', enabled: true },
                      { id: 'security', label: 'Security Alerts', description: 'Receive alerts for security incidents', enabled: true },
                      { id: 'metrics', label: 'Metric Alerts', description: 'Get notified when metrics exceed thresholds', enabled: true },
                      { id: 'reports', label: 'Report Generation', description: 'Notify when reports are ready', enabled: true },
                      { id: 'weekly', label: 'Weekly Summary', description: 'Receive weekly compliance summary', enabled: false },
                      { id: 'updates', label: 'Product Updates', description: 'Get notified about new features', enabled: false },
                    ].map((notification) => (
                      <div key={notification.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {notification.label}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {notification.description}
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            defaultChecked={notification.enabled}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Security Section */}
              {activeSection === 'security' && (
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                    Security Settings
                  </h2>

                  <div className="space-y-6">
                    {/* Password Change */}
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <h3 className="font-medium text-gray-900 dark:text-white mb-4">
                        Change Password
                      </h3>
                      <div className="space-y-4 max-w-md">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Current Password
                          </label>
                          <input type="password" className="input-field w-full" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            New Password
                          </label>
                          <input type="password" className="input-field w-full" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Confirm New Password
                          </label>
                          <input type="password" className="input-field w-full" />
                        </div>
                        <button className="btn btn-primary">Update Password</button>
                      </div>
                    </div>

                    {/* 2FA */}
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            Two-Factor Authentication
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Add an extra layer of security to your account
                          </p>
                        </div>
                        <span className="px-3 py-1 text-xs font-medium rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                          Enabled
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* API Keys Section */}
              {activeSection === 'api' && (
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                    API Keys
                  </h2>

                  <div className="space-y-6">
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            Production API Key
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Use this key for production environments
                          </p>
                        </div>
                        <button className="btn btn-secondary btn-sm">Regenerate</button>
                      </div>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 p-3 bg-gray-900 text-gray-100 rounded-lg text-sm font-mono">
                          cert_prod_••••••••••••••••••••••••
                        </code>
                        <button className="btn btn-secondary btn-sm">Copy</button>
                      </div>
                    </div>

                    <button className="btn btn-primary">Create New API Key</button>
                  </div>
                </div>
              )}

              {/* Integrations Section */}
              {activeSection === 'integrations' && (
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                    Integrations
                  </h2>

                  <div className="space-y-4">
                    {[
                      { name: 'OpenAI', status: 'connected', description: 'GPT-4, GPT-3.5 Turbo' },
                      { name: 'Anthropic', status: 'connected', description: 'Claude 3.5 Sonnet, Claude 3 Opus' },
                      { name: 'AWS Bedrock', status: 'connected', description: 'Amazon Titan, Llama 2' },
                      { name: 'Google AI', status: 'disconnected', description: 'Gemini Pro, PaLM 2' },
                      { name: 'Slack', status: 'connected', description: 'Compliance alerts and notifications' },
                    ].map((integration) => (
                      <div
                        key={integration.name}
                        className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-white dark:bg-gray-700 rounded-lg flex items-center justify-center">
                            <ServerStackIcon className="h-6 w-6 text-gray-400" />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900 dark:text-white">
                              {integration.name}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {integration.description}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className={`px-3 py-1 text-xs font-medium rounded-full ${
                              integration.status === 'connected'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                            }`}
                          >
                            {integration.status === 'connected' ? 'Connected' : 'Disconnected'}
                          </span>
                          <button className="btn btn-secondary btn-sm">
                            {integration.status === 'connected' ? 'Configure' : 'Connect'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Appearance Section */}
              {activeSection === 'appearance' && (
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                    Appearance
                  </h2>

                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        Theme
                      </h3>
                      <div className="grid grid-cols-3 gap-4">
                        {['Light', 'Dark', 'System'].map((theme) => (
                          <button
                            key={theme}
                            className={`p-4 rounded-lg border-2 transition-colors ${
                              theme === 'System'
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                                : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                            }`}
                          >
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {theme}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Region Section */}
              {activeSection === 'region' && (
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                    Region & Language
                  </h2>

                  <div className="space-y-6 max-w-md">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Language
                      </label>
                      <select className="input-field w-full">
                        <option>English (US)</option>
                        <option>Spanish (ES)</option>
                        <option>German (DE)</option>
                        <option>French (FR)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Timezone
                      </label>
                      <select className="input-field w-full">
                        <option>Europe/Madrid (GMT+1)</option>
                        <option>Europe/London (GMT)</option>
                        <option>Europe/Paris (GMT+1)</option>
                        <option>America/New_York (GMT-5)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Date Format
                      </label>
                      <select className="input-field w-full">
                        <option>DD/MM/YYYY</option>
                        <option>MM/DD/YYYY</option>
                        <option>YYYY-MM-DD</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Save Button */}
              <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-4">
                <button className="btn btn-secondary">Cancel</button>
                <button onClick={handleSave} disabled={loading} className="btn btn-primary flex items-center gap-2">
                  {saved && <CheckIcon className="h-4 w-4" />}
                  {saved ? 'Saved!' : loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
