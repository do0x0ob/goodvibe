import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { useDonationConfig } from '@/hooks/useDonationConfig';
import { Button } from '../ui/Button';
import { Project } from '@/types/project';

interface DonationConfigProps {
  vaultId: string;
  projects: Project[];
}

export const DonationConfig: React.FC<DonationConfigProps> = ({ vaultId, projects }) => {
  const { setDonationConfig, isLoading } = useDonationConfig();
  const [selectedProject, setSelectedProject] = useState('');
  const [percentage, setPercentage] = useState(10);

  const handleSave = () => {
    if (!selectedProject) return;
    setDonationConfig(vaultId, selectedProject, percentage);
  };

  return (
    <Card>
      <h3 className="text-xl font-serif font-medium text-ink-900">Donation Config</h3>
      <p className="text-sm text-ink-500 mb-6 font-sans">
        Automatically donate a percentage of your yield to selected projects.
      </p>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-ink-700 mb-2 font-sans">Select Project</label>
          <div className="relative">
            <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="block w-full rounded-lg border-ink-300 py-2.5 pl-3 pr-10 text-base focus:border-ink-900 focus:outline-none focus:ring-ink-900 sm:text-sm border bg-surface text-ink-900 appearance-none"
            >
                <option value="">Select a project...</option>
                {projects?.map((p) => (
                <option key={p.id} value={p.id}>{p.title}</option>
                ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-ink-500">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
            </div>
          </div>
        </div>

        <div>
          <div className="flex justify-between mb-2">
            <label className="block text-sm font-medium text-ink-700 font-sans">Donation Percentage</label>
            <span className="text-sm text-ink-900 font-serif font-medium">{percentage}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={percentage}
            onChange={(e) => setPercentage(Number(e.target.value))}
            className="w-full h-2 bg-canvas-subtle rounded-lg appearance-none cursor-pointer accent-ink-900"
          />
          <div className="flex justify-between text-xs text-ink-400 mt-1 font-sans">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>

        <Button onClick={handleSave} isLoading={isLoading} disabled={!selectedProject} fullWidth>
          Save Configuration
        </Button>
      </div>
    </Card>
  );
};
