'use client';

import React, { useState } from 'react';
import { Project } from '@/types/project';
import { Container } from '../layout/Container';
import { Button } from '../ui/Button';
import { formatAddress, formatBalance } from '@/utils/formatters';
import { useMockData } from '@/contexts/MockDataContext';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

interface ProjectDetailProps {
  project: Project;
  isCreator: boolean;
  hasVault: boolean;
  onCreateMockVault: () => void;
}

export const ProjectDetail: React.FC<ProjectDetailProps> = ({ 
  project, 
  isCreator,
  hasVault,
  onCreateMockVault
}) => {
  const { hasAllocation, addAllocation, updateAllocation, allocations } = useMockData();
  const [activeTab, setActiveTab] = useState<'about' | 'updates' | 'supporters'>('about');
  const [isSaving, setIsSaving] = useState(false);
  const [percentage, setPercentage] = useState(25);

  // 檢查是否已加入
  const isAlreadyAdded = hasAllocation(project.id);
  const currentAllocation = allocations.find(a => a.projectId === project.id);

  // 如果已添加，同步當前百分比
  React.useEffect(() => {
    if (currentAllocation) {
      setPercentage(currentAllocation.percentage);
    }
  }, [currentAllocation]);

  // Calculate progress percentage (假設目標金額為當前的 150%)
  const goalAmount = Number(project.raisedAmount) * 1.5;
  const progressPercentage = (Number(project.raisedAmount) / goalAmount) * 100;

  const handleSaveAllocation = async () => {
    setIsSaving(true);
    try {
      if (isAlreadyAdded) {
        // 更新現有分配
        updateAllocation(project.id, percentage);
        toast.success(`Updated allocation to ${percentage}%`);
      } else {
        // 添加新分配
        addAllocation(project.id, percentage);
        toast.success(`${project.title} added with ${percentage}% allocation`);
      }
    } catch (error) {
      toast.error('Failed to update allocation');
    } finally {
      setIsSaving(false);
    }
  };

  // Mock data for updates and supporters
  const updates = [
    {
      id: 1,
      date: 'Jan 10, 2026',
      title: 'Project Launch Update',
      content: 'We are excited to announce the official launch of our project. Thank you to all our early supporters!',
    },
    {
      id: 2,
      date: 'Jan 5, 2026',
      title: 'Milestone Reached: 50% Funded',
      content: 'Amazing news! We have reached 50% of our funding goal. Your support means everything to us.',
    },
  ];

  const recentSupporters = [
    { address: '0x1234...5678', amount: 500, date: '2 hours ago' },
    { address: '0x8765...4321', amount: 250, date: '5 hours ago' },
    { address: '0xabcd...efgh', amount: 1000, date: '1 day ago' },
  ];

  return (
    <div className="bg-canvas-default">
      {/* Hero Section with Image */}
      <div className="relative h-[400px] bg-ink-900">
        {project.imageUrl && (
          <img 
            src={project.imageUrl} 
            alt={project.title} 
            className="w-full h-full object-cover opacity-90"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink-900/60 to-transparent" />
      </div>

      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 -mt-32 relative z-10">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Project Title Card */}
            <div className="bg-surface rounded-2xl p-8 shadow-lg border border-ink-300/20">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-canvas-sand text-ink-900 uppercase tracking-wide mb-3">
                    {project.category}
                  </span>
                  <h1 className="text-4xl font-serif text-ink-900 mb-2">{project.title}</h1>
                  <p className="text-sm text-ink-500">
                    By {formatAddress(project.creator)}
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-6">
                <div className="flex justify-between items-baseline mb-2">
                  <span className="text-3xl font-serif text-ink-900">
                    ${formatBalance(project.raisedAmount)}
                  </span>
                  <span className="text-sm text-ink-500">
                    of ${(goalAmount / 1_000_000).toFixed(0)}K goal
                  </span>
                </div>
                <div className="w-full h-2 bg-canvas-subtle rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-accent-primary transition-all duration-500"
                    style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between items-center mt-3 text-sm text-ink-500">
                  <span>{project.supporterCount} supporters</span>
                  <span>{progressPercentage.toFixed(0)}% funded</span>
                </div>
              </div>
            </div>

            {/* Tabs Navigation */}
            <div className="bg-surface rounded-2xl shadow-sm border border-ink-300/20">
              <div className="border-b border-ink-300/20">
                <nav className="flex space-x-8 px-8" aria-label="Tabs">
                  {[
                    { id: 'about', label: 'About' },
                    { id: 'updates', label: 'Updates', badge: updates.length },
                    { id: 'supporters', label: 'Supporters', badge: project.supporterCount },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === tab.id
                          ? 'border-ink-900 text-ink-900'
                          : 'border-transparent text-ink-500 hover:text-ink-700 hover:border-ink-300'
                      }`}
                    >
                      {tab.label}
                      {tab.badge !== undefined && (
                        <span className="ml-2 py-0.5 px-2 rounded-full text-xs bg-canvas-subtle text-ink-700">
                          {tab.badge}
                        </span>
                      )}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Tab Content */}
              <div className="p-8">
                {activeTab === 'about' && (
                  <div className="prose prose-lg max-w-none">
                    <div className="text-ink-700 leading-relaxed space-y-4">
                      <p className="text-lg">{project.description}</p>
                      
                      <h3 className="text-2xl font-serif text-ink-900 mt-8 mb-4">Project Goals</h3>
                      <ul className="space-y-2">
                        <li>Deploy innovative solutions to address key challenges</li>
                        <li>Engage community members and stakeholders</li>
                        <li>Achieve measurable impact within the next 12 months</li>
                        <li>Maintain transparency and regular communication</li>
                      </ul>

                      <h3 className="text-2xl font-serif text-ink-900 mt-8 mb-4">Impact</h3>
                      <p>
                        Your support enables us to continue our mission and scale our impact. 
                        Every contribution helps us move closer to our goals and create lasting change.
                      </p>
                    </div>
                  </div>
                )}

                {activeTab === 'updates' && (
                  <div className="space-y-6">
                    {updates.map((update) => (
                      <div key={update.id} className="border-b border-ink-300/20 last:border-0 pb-6 last:pb-0">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-xl font-serif text-ink-900">{update.title}</h3>
                          <span className="text-xs text-ink-500 font-mono">{update.date}</span>
                        </div>
                        <p className="text-ink-700 leading-relaxed">{update.content}</p>
                      </div>
                    ))}
                    {updates.length === 0 && (
                      <p className="text-center text-ink-500 py-8">No updates yet</p>
                    )}
                  </div>
                )}

                {activeTab === 'supporters' && (
                  <div className="space-y-4">
                    {recentSupporters.map((supporter, idx) => (
                      <div key={idx} className="flex items-center justify-between py-3 border-b border-ink-300/20 last:border-0">
                        <div>
                          <p className="font-medium text-ink-900">{formatAddress(supporter.address)}</p>
                          <p className="text-xs text-ink-500">{supporter.date}</p>
                        </div>
                        <span className="font-medium text-ink-900">${(supporter.amount / 1_000_000).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Support Card */}
              <div className="bg-surface rounded-2xl p-6 shadow-lg border border-ink-300/20">
                <h3 className="text-xl font-serif text-ink-900 mb-2">Support This Project</h3>
                <p className="text-sm text-ink-700 mb-6 leading-relaxed">
                  Allocate a portion of your donation pool to this project
                </p>
                
                {!hasVault ? (
                  // No Vault State
                  <div className="mb-6 p-4 bg-canvas-sand rounded-lg border border-ink-300/20">
                    <p className="text-xs text-ink-700 mb-3">
                      You need a vault to support projects
                    </p>
                    <Button 
                      onClick={onCreateMockVault}
                      size="sm" 
                      className="w-full"
                    >
                      Create Vault (Demo)
                    </Button>
                  </div>
                ) : (
                  // Has Vault - Configure Allocation
                  <div className="space-y-5">
                    {isAlreadyAdded && (
                      <div className="p-3 bg-canvas-sage/30 rounded-lg border border-ink-300/20">
                        <p className="text-xs text-ink-700 leading-relaxed flex items-center gap-2">
                          <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Already in your portfolio. Adjust allocation below.
                        </p>
                      </div>
                    )}

                    {/* Percentage Input */}
                    <div>
                      <label className="block text-sm font-medium text-ink-700 mb-2">
                        Allocation Percentage
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="5"
                          value={percentage}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            if (val >= 0 && val <= 100) {
                              setPercentage(val);
                            }
                          }}
                          className="block w-full rounded-lg border border-ink-300/30 py-3 pl-4 pr-12 text-base focus:border-ink-900 focus:ring-1 focus:ring-ink-900 bg-white text-ink-900 transition-colors"
                          placeholder="25"
                        />
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                          <span className="text-ink-500 text-sm">%</span>
                        </div>
                      </div>
                      <p className="mt-2 text-xs text-ink-600">
                        {percentage}% of your donation pool will go to this project
                      </p>
                    </div>

                    <Button
                      onClick={handleSaveAllocation}
                      isLoading={isSaving}
                      className="w-full"
                      size="lg"
                    >
                      {isAlreadyAdded ? 'Update Allocation' : 'Add to My Allocations'}
                    </Button>

                    {isAlreadyAdded && (
                      <Link href="/?view=dashboard">
                        <Button variant="outline" className="w-full" size="sm">
                          View All Allocations
                        </Button>
                      </Link>
                    )}
                  </div>
                )}

                {isCreator && (
                  <div className="mt-4 pt-4 border-t border-ink-300/20">
                    <Link href={`/project/${project.id}/manage`}>
                      <Button 
                        variant="outline"
                        className="w-full"
                      >
                        Manage Project
                      </Button>
                    </Link>
                  </div>
                )}
              </div>

              {/* Stats Card */}
              <div className="bg-canvas-sage rounded-2xl p-6 border border-ink-300/20">
                <h3 className="text-lg font-serif text-ink-900 mb-4">Project Stats</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-ink-500 uppercase tracking-wide mb-1">Created</p>
                    <p className="text-sm font-medium text-ink-900">Jan 1, 2026</p>
                  </div>
                  <div>
                    <p className="text-xs text-ink-500 uppercase tracking-wide mb-1">Last Update</p>
                    <p className="text-sm font-medium text-ink-900">Jan 10, 2026</p>
                  </div>
                  <div>
                    <p className="text-xs text-ink-500 uppercase tracking-wide mb-1">Total Supporters</p>
                    <p className="text-sm font-medium text-ink-900">{project.supporterCount}</p>
                  </div>
                  <div>
                    <p className="text-xs text-ink-500 uppercase tracking-wide mb-1">Category</p>
                    <p className="text-sm font-medium text-ink-900">{project.category}</p>
                  </div>
                </div>
              </div>

              {/* Share Card */}
              <div className="bg-surface rounded-2xl p-6 border border-ink-300/20">
                <h3 className="text-lg font-serif text-ink-900 mb-4">Share This Project</h3>
                <div className="flex gap-2">
                  <button className="flex-1 py-2 px-3 rounded-lg border border-ink-300/30 hover:border-ink-900 hover:bg-canvas-subtle transition-all text-sm text-ink-700">
                    <svg className="w-4 h-4 mx-auto" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                    </svg>
                  </button>
                  <button className="flex-1 py-2 px-3 rounded-lg border border-ink-300/30 hover:border-ink-900 hover:bg-canvas-subtle transition-all text-sm text-ink-700">
                    <svg className="w-4 h-4 mx-auto" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm6.066 9.645c.183 4.04-2.83 8.544-8.164 8.544-1.622 0-3.131-.476-4.402-1.291 1.524.18 3.045-.244 4.252-1.189-1.256-.023-2.317-.854-2.684-1.995.451.086.895.061 1.298-.049-1.381-.278-2.335-1.522-2.304-2.853.388.215.83.344 1.301.359-1.279-.855-1.641-2.544-.889-3.835 1.416 1.738 3.533 2.881 5.92 3.001-.419-1.796.944-3.527 2.799-3.527.825 0 1.572.349 2.096.907.654-.128 1.27-.368 1.824-.697-.215.671-.67 1.233-1.263 1.589.581-.07 1.135-.224 1.649-.453-.384.578-.87 1.084-1.433 1.489z"/>
                    </svg>
                  </button>
                  <button className="flex-1 py-2 px-3 rounded-lg border border-ink-300/30 hover:border-ink-900 hover:bg-canvas-subtle transition-all text-sm text-ink-700">
                    <svg className="w-4 h-4 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
};
