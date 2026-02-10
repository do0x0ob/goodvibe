'use client';

import React from 'react';
import Link from 'next/link';
import { formatBalance } from '@/utils/formatters';
import { SupportedProject } from '@/hooks/useDashboardV2';

interface SupportedProjectsSectionProps {
  projects: SupportedProject[];
  hasRecord: boolean;
}

/**
 * 支持的項目列表區塊
 * 顯示用戶當前支持的所有項目
 */
export const SupportedProjectsSection: React.FC<SupportedProjectsSectionProps> = ({
  projects,
  hasRecord,
}) => {
  if (!hasRecord) {
    return <NoRecordState />;
  }

  if (projects.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="bg-white rounded-3xl border border-ink-200 shadow-sm">
      <div className="p-6 border-b border-ink-100">
        <h3 className="text-xl font-serif font-bold text-ink-900">
          Projects I Support
        </h3>
        <p className="text-sm text-ink-500 mt-1">
          {projects.length} active support{projects.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="divide-y divide-ink-100">
        {projects.map((project) => (
          <SupportedProjectCard key={project.projectId} project={project} />
        ))}
      </div>
    </div>
  );
};

// ==================== Sub-Components ====================

interface SupportedProjectCardProps {
  project: SupportedProject;
}

function SupportedProjectCard({ project }: SupportedProjectCardProps) {
  const supportAmount = BigInt(project.supportInfo.amount);
  const lastUpdated = new Date(project.supportInfo.lastUpdated).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <Link href={`/project/${project.projectId}`}>
      <div className="p-6 hover:bg-canvas-subtle transition-colors cursor-pointer group">
        <div className="flex items-start gap-4">
          {/* Project Image */}
          {project.projectData.imageUrl && (
            <img
              src={project.projectData.imageUrl}
              alt={project.projectData.title}
              className="w-24 h-24 rounded-xl object-cover border border-ink-200"
            />
          )}

          {/* Project Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 mb-2">
              <div>
                <h4 className="text-lg font-serif font-bold text-ink-900 group-hover:text-ink-700 transition-colors">
                  {project.projectData.title}
                </h4>
                <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-ink-100 text-ink-600 mt-1">
                  {project.projectData.category}
                </span>
              </div>
              
              {/* Support Amount Badge */}
              <div className="text-right shrink-0">
                <div className="text-sm text-ink-500 mb-1">Your Support</div>
                <div className="text-2xl font-bold text-ink-900">
                  ${formatBalance(supportAmount)}
                </div>
              </div>
            </div>

            {/* Project Stats */}
            <div className="flex items-center gap-6 text-sm text-ink-500 mt-3">
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                  />
                </svg>
                <span>${formatBalance(BigInt(project.projectData.totalSupportAmount))} total</span>
              </div>
              
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
                <span>{project.projectData.supporterCount} supporters</span>
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
                <span>Since {lastUpdated}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ==================== Empty States ====================

function NoRecordState() {
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
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </div>
      <h3 className="text-xl font-serif font-bold text-ink-900 mb-2">
        No Support Record Yet
      </h3>
      <p className="text-ink-600 mb-6">
        Create a support record to start supporting projects
      </p>
      <Link
        href="/projects"
        className="inline-block px-6 py-3 bg-ink-900 text-white rounded-xl font-medium hover:bg-ink-800 transition-colors"
      >
        Explore Projects
      </Link>
    </div>
  );
}

function EmptyState() {
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
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
      </div>
      <h3 className="text-xl font-serif font-bold text-ink-900 mb-2">
        No Projects Supported Yet
      </h3>
      <p className="text-ink-600 mb-6">
        Browse projects and start supporting causes you care about
      </p>
      <Link
        href="/projects"
        className="inline-block px-6 py-3 bg-ink-900 text-white rounded-xl font-medium hover:bg-ink-800 transition-colors"
      >
        Browse Projects
      </Link>
    </div>
  );
}
