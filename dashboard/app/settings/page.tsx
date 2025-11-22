'use client';

import { useState } from 'react';
import {
  CogIcon,
  UserCircleIcon,
  BellIcon,
  ShieldCheckIcon,
  KeyIcon,
  GlobeAltIcon,
  PaintBrushIcon,
  ServerStackIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';

const settingsSections = [
  { id: 'profile', name: 'Profile', icon: UserCircleIcon },
  { id: 'notifications', name: 'Notifications', icon: BellIcon },
  { id: 'security', name: 'Security', icon: ShieldCheckIcon },
  { id: 'api', name: 'API Keys', icon: KeyIcon },
  { id: 'integrations', name: 'Integrations', icon: ServerStackIcon },
  { id: 'appearance', name: 'Appearance', icon: PaintBrushIcon },
  { id: 'region', name: 'Region & Language', icon: GlobeAltIcon },
];

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('profile');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
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
                    <section.icon className="h-5 w-5" />
                    {section.name}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="card">
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
                        <button className="btn-secondary text-sm">Change Avatar</button>
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
                        <button className="btn-primary">Update Password</button>
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

                    {/* Active Sessions */}
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <h3 className="font-medium text-gray-900 dark:text-white mb-4">
                        Active Sessions
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-lg">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              Chrome on MacOS
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              Madrid, Spain - Current session
                            </div>
                          </div>
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                            Active
                          </span>
                        </div>
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
                        <button className="btn-secondary text-sm">Regenerate</button>
                      </div>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 p-3 bg-gray-900 text-gray-100 rounded-lg text-sm font-mono">
                          cert_prod_••••••••••••••••••••••••
                        </code>
                        <button className="btn-secondary text-sm">Copy</button>
                      </div>
                    </div>

                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            Development API Key
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Use this key for testing and development
                          </p>
                        </div>
                        <button className="btn-secondary text-sm">Regenerate</button>
                      </div>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 p-3 bg-gray-900 text-gray-100 rounded-lg text-sm font-mono">
                          cert_dev_••••••••••••••••••••••••
                        </code>
                        <button className="btn-secondary text-sm">Copy</button>
                      </div>
                    </div>

                    <button className="btn-primary">Create New API Key</button>
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
                          <button className="btn-secondary text-sm">
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

                    <div>
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        Sidebar
                      </h3>
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2">
                          <input type="checkbox" defaultChecked className="rounded" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Collapsed by default
                          </span>
                        </label>
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

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Currency
                      </label>
                      <select className="input-field w-full">
                        <option>EUR (€)</option>
                        <option>USD ($)</option>
                        <option>GBP (£)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Save Button */}
              <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-4">
                <button className="btn-secondary">Cancel</button>
                <button onClick={handleSave} className="btn-primary flex items-center gap-2">
                  {saved && <CheckIcon className="h-4 w-4" />}
                  {saved ? 'Saved!' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
