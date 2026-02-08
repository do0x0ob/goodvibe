'use client';

import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Project } from '@/types/project';
import Link from 'next/link';

interface MyProjectsManagerProps {
  userAddress: string;
}

export const MyProjectsManager: React.FC<MyProjectsManagerProps> = ({ userAddress }) => {
  const [activeView, setActiveView] = useState<'created' | 'form'>('created');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Environment',
    imageUrl: '',
    goalAmount: '',
  });

  // Mock created projects - 使用已存在的 mock projects
  const myProjects: Project[] = [
    {
      id: 'mock-3',
      title: 'Wildlife Conservation Network',
      description: 'Protecting endangered species through technology-driven monitoring and anti-poaching systems. We use AI and satellite imaging to track and protect wildlife.',
      category: 'Wildlife',
      imageUrl: 'https://images.unsplash.com/photo-1564760055775-d63b17a55c44?q=80&w=2076&auto=format&fit=crop',
      creator: userAddress,
      raisedAmount: BigInt(38500_000_000), // 38,500 USDC
      supporterCount: 1089,
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Creating project:', formData);
    // 實際應該調用合約方法創建項目
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="bg-surface rounded-2xl border border-ink-300/20 shadow-sm overflow-hidden">
        <div className="border-b border-ink-300/20">
          <nav className="flex" aria-label="Tabs">
            <button
              onClick={() => setActiveView('created')}
              className={`flex-1 py-4 px-6 text-center text-sm font-medium border-b-2 transition-colors ${
                activeView === 'created'
                  ? 'border-ink-900 text-ink-900'
                  : 'border-transparent text-ink-500 hover:text-ink-700 hover:border-ink-300'
              }`}
            >
              My Projects ({myProjects.length})
            </button>
            <button
              onClick={() => setActiveView('form')}
              className={`flex-1 py-4 px-6 text-center text-sm font-medium border-b-2 transition-colors ${
                activeView === 'form'
                  ? 'border-ink-900 text-ink-900'
                  : 'border-transparent text-ink-500 hover:text-ink-700 hover:border-ink-300'
              }`}
            >
              Create New Project
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeView === 'created' ? (
            // My Projects List
            <div className="space-y-4">
              {myProjects.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-ink-300/30 rounded-xl">
                  <svg className="w-12 h-12 text-ink-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <p className="text-sm text-ink-500 mb-4">No projects created yet</p>
                  <Button onClick={() => setActiveView('form')} size="sm">
                    Create Your First Project
                  </Button>
                </div>
              ) : (
                myProjects.map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center gap-4 p-4 rounded-xl border border-ink-300/20 hover:border-ink-300/40 transition-all group"
                  >
                    {project.imageUrl && (
                      <img
                        src={project.imageUrl}
                        alt={project.title}
                        className="w-20 h-20 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-1">
                        <div>
                          <Link href={`/project/${project.id}`}>
                            <h4 className="font-serif text-lg text-ink-900 group-hover:text-accent-primary transition-colors">
                              {project.title}
                            </h4>
                          </Link>
                          <p className="text-xs text-ink-500">{project.category}</p>
                        </div>
                        <span className="text-xs text-ink-400 bg-canvas-sage px-2 py-1 rounded-full">
                          Active
                        </span>
                      </div>
                      <div className="flex items-center gap-6 mt-2 text-sm text-ink-600">
                        <span>${(Number(project.raisedAmount) / 1_000_000).toFixed(2)} raised</span>
                        <span>{project.supporterCount} supporters</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/project/${project.id}/manage`}>
                        <Button variant="outline" size="sm">
                          Manage
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            // Create Project Form
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-2">
                  Project Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="block w-full rounded-lg border border-ink-300/30 px-4 py-3 focus:border-ink-900 focus:ring-1 focus:ring-ink-900 text-base bg-surface transition-colors"
                  placeholder="Give your project a descriptive title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-700 mb-2">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="block w-full rounded-lg border border-ink-300/30 px-4 py-3 focus:border-ink-900 focus:ring-1 focus:ring-ink-900 text-base bg-surface transition-colors"
                  required
                >
                  <option value="Environment">Environment</option>
                  <option value="Wildlife">Wildlife</option>
                  <option value="Education">Education</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Technology">Technology</option>
                  <option value="Community">Community</option>
                  <option value="Arts & Culture">Arts & Culture</option>
                  <option value="Research">Research</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="block w-full rounded-lg border border-ink-300/30 px-4 py-3 focus:border-ink-900 focus:ring-1 focus:ring-ink-900 text-base bg-surface transition-colors resize-none"
                  placeholder="Describe your project, its goals, and how the funds will be used"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-700 mb-2">
                  Cover Image URL
                </label>
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="block w-full rounded-lg border border-ink-300/30 px-4 py-3 focus:border-ink-900 focus:ring-1 focus:ring-ink-900 text-base bg-surface transition-colors"
                  placeholder="https://example.com/image.jpg"
                />
                {formData.imageUrl && (
                  <div className="mt-3">
                    <img
                      src={formData.imageUrl}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-lg border border-ink-300/20"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-700 mb-2">
                  Funding Goal (USDC)
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <span className="text-ink-500 text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    value={formData.goalAmount}
                    onChange={(e) => setFormData({ ...formData, goalAmount: e.target.value })}
                    className="block w-full rounded-lg border border-ink-300/30 pl-8 pr-4 py-3 focus:border-ink-900 focus:ring-1 focus:ring-ink-900 text-base bg-surface transition-colors"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
                <p className="mt-1.5 text-xs text-ink-500">
                  Optional: Set a fundraising goal for your project
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1">
                  Create Project
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveView('created')}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
