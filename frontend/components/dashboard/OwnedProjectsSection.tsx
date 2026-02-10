'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { formatBalance } from '@/utils/formatters';
import { OwnedProject } from '@/hooks/useDashboardV2';
import { Button } from '../ui/Button';
import { CreateProjectForm } from './CreateProjectForm';

interface OwnedProjectsSectionProps {
  projects: OwnedProject[];
  projectCount: number;
}

/**
 * 我創建的項目區塊
 * 顯示用戶創建和管理的項目列表
 */
export const OwnedProjectsSection: React.FC<OwnedProjectsSectionProps> = ({
  projects,
  projectCount,
}) => {
  const [showCreateForm, setShowCreateForm] = useState(false);

  if (projectCount === 0 && !showCreateForm) {
    return <EmptyState onCreateClick={() => setShowCreateForm(true)} />;
  }

  return (
    <div className="space-y-6">
      {/* Create New Button */}
      {!showCreateForm && (
        <button
          onClick={() => setShowCreateForm(true)}
          className="w-full py-4 border-2 border-dashed border-ink-200 rounded-2xl text-ink-500 hover:border-ink-400 hover:text-ink-700 hover:bg-ink-50/50 transition-all font-medium flex items-center justify-center gap-2 group"
        >
          <span className="w-8 h-8 rounded-full bg-ink-100 flex items-center justify-center group-hover:bg-ink-200 transition-colors">
            <svg
              className="w-5 h-5 text-ink-500 group-hover:text-ink-700"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </span>
          Create New Project
        </button>
      )}

      {/* Create Form */}
      {showCreateForm && (
        <CreateProjectForm
          onSuccess={() => setShowCreateForm(false)}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {/* Projects List */}
      {projects.length > 0 && (
        <div className="bg-white rounded-3xl border border-ink-200 shadow-sm">
          <div className="p-6 border-b border-ink-100">
            <h3 className="text-xl font-serif font-bold text-ink-900">
              My Projects
            </h3>
            <p className="text-sm text-ink-500 mt-1">
              {projectCount} project{projectCount !== 1 ? 's' : ''} created
            </p>
          </div>

          <div className="divide-y divide-ink-100">
            {projects.map((project) => (
              <OwnedProjectCard key={project.projectId} project={project} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ==================== Sub-Components ====================

interface OwnedProjectCardProps {
  project: OwnedProject;
}

function OwnedProjectCard({ project }: OwnedProjectCardProps) {
  const balance = BigInt(project.financial.balance);
  const totalReceived = BigInt(project.financial.totalReceived);
  const totalSupport = BigInt(project.financial.totalSupportAmount);

  return (
    <div className="p-6 hover:bg-canvas-subtle transition-colors group">
      <div className="flex items-start gap-4">
        {/* Project Image */}
        {project.metadata.imageUrl && (
          <img
            src={project.metadata.imageUrl}
            alt={project.metadata.title}
            className="w-32 h-32 rounded-xl object-cover border border-ink-200"
          />
        )}

        {/* Project Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <Link href={`/project/${project.projectId}/manage`}>
                <h4 className="text-xl font-serif font-bold text-ink-900 group-hover:text-ink-700 transition-colors">
                  {project.metadata.title}
                </h4>
              </Link>
              <div className="flex items-center gap-3 mt-2">
                <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-ink-100 text-ink-600">
                  {project.metadata.category}
                </span>
                <span
                  className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                    project.stats.isActive
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {project.stats.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>

          {/* Financial Stats Grid */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <StatItem
              label="Available Balance"
              value={`$${formatBalance(balance)}`}
              highlighted={balance > BigInt(0)}
            />
            <StatItem
              label="Total Received"
              value={`$${formatBalance(totalReceived)}`}
            />
            <StatItem
              label="Total Support"
              value={`$${formatBalance(totalSupport)}`}
            />
          </div>

          {/* Engagement Stats */}
          <div className="flex items-center gap-6 text-sm text-ink-500">
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <span>{project.stats.supporterCount} supporters</span>
            </div>

            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                />
              </svg>
              <span>{project.stats.updatesCount} updates</span>
            </div>

            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span>
                {new Date(Number(project.stats.createdAt)).toLocaleDateString('en-US', {
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-4">
            <Link href={`/project/${project.projectId}/manage`} className="flex-1">
              <Button variant="default" size="sm" className="w-full">
                Manage Project
              </Button>
            </Link>
            <Link href={`/project/${project.projectId}`} className="flex-1">
              <Button variant="outline" size="sm" className="w-full">
                View Public Page
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

interface StatItemProps {
  label: string;
  value: string;
  highlighted?: boolean;
}

function StatItem({ label, value, highlighted }: StatItemProps) {
  return (
    <div
      className={`p-3 rounded-xl ${
        highlighted ? 'bg-canvas-sage border border-green-200' : 'bg-ink-50'
      }`}
    >
      <div className="text-xs text-ink-500 mb-1">{label}</div>
      <div
        className={`text-lg font-bold ${
          highlighted ? 'text-green-800' : 'text-ink-900'
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div className="bg-white rounded-3xl border border-ink-200 p-12 text-center">
      <div className="w-16 h-16 bg-ink-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg
          className="w-8 h-8 text-ink-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
      </div>
      <h3 className="text-xl font-serif font-bold text-ink-900 mb-2">
        No Projects Created Yet
      </h3>
      <p className="text-ink-600 mb-6">
        Create your first project and start receiving support from the community
      </p>
      <button
        onClick={onCreateClick}
        className="inline-block px-6 py-3 bg-ink-900 text-white rounded-xl font-medium hover:bg-ink-800 transition-colors"
      >
        Create Your First Project
      </button>
    </div>
  );
}
