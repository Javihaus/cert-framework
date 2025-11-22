'use client';

import Card from './Card';
import Button from './Button';
import { ROIInputs } from '@/types/wizard';

interface WizardROIFormProps {
  inputs: ROIInputs;
  onChange: (inputs: ROIInputs) => void;
  onSubmit: () => void;
}

export default function WizardROIForm({ inputs, onChange, onSubmit }: WizardROIFormProps) {
  const updateField = (field: keyof ROIInputs, value: number) => {
    onChange({ ...inputs, [field]: value });
  };

  return (
    <div>
      <h2 className="text-3xl font-bold text-zinc-900 dark:text-white mb-1">ROI Calculator</h2>
      <p className="text-base text-zinc-500 dark:text-zinc-400 mb-8">
        Calculate the business case for AI automation. We'll compare your current manual process costs against estimated AI costs.
      </p>

      {/* Current Manual Process */}
      <Card className="mb-6 bg-red-50 dark:bg-red-900/20 border-red-500">
        <h3 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4">Current Manual Process</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-zinc-900 dark:text-white mb-1 block">Tasks per Month</label>
            <input type="number" value={inputs.tasksPerMonth} onChange={(e) => updateField('tasksPerMonth', Number(e.target.value))} placeholder="1000" className="w-full px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white" />
            <p className="text-xs text-zinc-500 mt-1">How many tasks done manually today?</p>
          </div>
          <div>
            <label className="text-sm font-medium text-zinc-900 dark:text-white mb-1 block">Minutes per Task</label>
            <input type="number" value={inputs.minutesPerTask} onChange={(e) => updateField('minutesPerTask', Number(e.target.value))} placeholder="15" className="w-full px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white" />
            <p className="text-xs text-zinc-500 mt-1">Average time to complete one task</p>
          </div>
          <div>
            <label className="text-sm font-medium text-zinc-900 dark:text-white mb-1 block">Labor Cost per Hour ($)</label>
            <input type="number" value={inputs.laborCostPerHour} onChange={(e) => updateField('laborCostPerHour', Number(e.target.value))} placeholder="25" className="w-full px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white" />
            <p className="text-xs text-zinc-500 mt-1">Fully-loaded cost (salary + benefits)</p>
          </div>
          <div>
            <label className="text-sm font-medium text-zinc-900 dark:text-white mb-1 block">Error Rate (%)</label>
            <input type="number" value={inputs.errorRate} onChange={(e) => updateField('errorRate', Number(e.target.value))} placeholder="5" className="w-full px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white" />
            <p className="text-xs text-zinc-500 mt-1">Percentage of tasks with errors</p>
          </div>
          <div>
            <label className="text-sm font-medium text-zinc-900 dark:text-white mb-1 block">Cost per Error ($)</label>
            <input type="number" value={inputs.errorCostPerIncident} onChange={(e) => updateField('errorCostPerIncident', Number(e.target.value))} placeholder="100" className="w-full px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white" />
            <p className="text-xs text-zinc-500 mt-1">Average cost when error occurs</p>
          </div>
        </div>
      </Card>

      {/* AI System Estimates */}
      <Card className="mb-8 bg-green-50 dark:bg-green-900/20 border-green-600">
        <h3 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4">AI System Estimates</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-zinc-900 dark:text-white mb-1 block">AI Success Rate (%)</label>
            <input type="number" value={inputs.aiSuccessRate} onChange={(e) => updateField('aiSuccessRate', Number(e.target.value))} placeholder="85" className="w-full px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white" />
            <p className="text-xs text-zinc-500 mt-1">Expected accuracy of AI system</p>
          </div>
          <div>
            <label className="text-sm font-medium text-zinc-900 dark:text-white mb-1 block">AI Cost per Task ($)</label>
            <input type="number" step="0.01" value={inputs.aiCostPerTask} onChange={(e) => updateField('aiCostPerTask', Number(e.target.value))} placeholder="0.05" className="w-full px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white" />
            <p className="text-xs text-zinc-500 mt-1">Model inference + infrastructure</p>
          </div>
          <div>
            <label className="text-sm font-medium text-zinc-900 dark:text-white mb-1 block">Human Review (%)</label>
            <input type="number" value={inputs.humanReviewPercent} onChange={(e) => updateField('humanReviewPercent', Number(e.target.value))} placeholder="20" className="w-full px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white" />
            <p className="text-xs text-zinc-500 mt-1">What % of AI outputs need human review?</p>
          </div>
          <div>
            <label className="text-sm font-medium text-zinc-900 dark:text-white mb-1 block">Implementation Cost ($)</label>
            <input type="number" value={inputs.implementationCost} onChange={(e) => updateField('implementationCost', Number(e.target.value))} placeholder="50000" className="w-full px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white" />
            <p className="text-xs text-zinc-500 mt-1">One-time setup cost</p>
          </div>
        </div>
      </Card>

      <Button onClick={onSubmit} variant="primary" fullWidth size="lg">Calculate ROI</Button>
    </div>
  );
}
