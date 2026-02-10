'use client';

import React from 'react';
import { useDashboardV2 } from '@/hooks/useDashboardV2';
import { WalletBalanceCard } from './WalletBalanceCard';
import { SupportedProjectsSection } from './SupportedProjectsSection';
import { OwnedProjectsSection } from './OwnedProjectsSection';
import { Container } from '../layout/Container';

/**
 * Dashboard V2 - 統一的儀表板視圖
 * 
 * 分為兩個主要區塊：
 * 1. Supporter Section - 贊助人視角（支持的項目、錢包餘額）
 * 2. Creator Section - 創建者視角（我的項目、財務統計）
 */
export const DashboardV2: React.FC = () => {
  const { data, isLoading, error } = useDashboardV2();

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return <DashboardError error={error} />;
  }

  if (!data) {
    return <DashboardEmpty />;
  }

  const { supporter, creator } = data;

  return (
    <div className="min-h-screen bg-canvas-default py-12">
      <Container>
        <div className="space-y-12">
          {/* Header */}
          <div>
            <h1 className="text-4xl font-serif font-bold text-ink-900 mb-2">
              Dashboard
            </h1>
            <p className="text-ink-600">
              Manage your projects and track your support
            </p>
          </div>

          {/* Supporter Section */}
          <section>
            <h2 className="text-2xl font-serif font-bold text-ink-900 mb-6">
              As a Supporter
            </h2>
            <div className="space-y-6">
              <WalletBalanceCard wallet={supporter.wallet} />
              <SupportedProjectsSection
                projects={supporter.supportedProjects}
                hasRecord={supporter.hasRecord}
              />
            </div>
          </section>

          {/* Creator Section */}
          <section>
            <h2 className="text-2xl font-serif font-bold text-ink-900 mb-6">
              As a Creator
            </h2>
            <OwnedProjectsSection
              projects={creator.projects}
              projectCount={creator.projectCount}
            />
          </section>
        </div>
      </Container>
    </div>
  );
};

// ==================== Loading State ====================

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-canvas-default py-12">
      <Container>
        <div className="space-y-12">
          <div className="animate-pulse">
            <div className="h-10 bg-ink-100 rounded w-64 mb-2"></div>
            <div className="h-6 bg-ink-50 rounded w-96"></div>
          </div>
          
          <div className="space-y-4">
            <div className="h-32 bg-ink-50 rounded-2xl animate-pulse"></div>
            <div className="h-64 bg-ink-50 rounded-2xl animate-pulse"></div>
          </div>
        </div>
      </Container>
    </div>
  );
}

// ==================== Error State ====================

function DashboardError({ error }: { error: Error }) {
  return (
    <div className="min-h-screen bg-canvas-default py-12">
      <Container>
        <div className="bg-white rounded-2xl border border-red-200 p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-ink-900 mb-2">
            Failed to Load Dashboard
          </h3>
          <p className="text-ink-600 mb-4">{error.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-ink-900 text-white rounded-lg hover:bg-ink-800 transition-colors"
          >
            Reload Page
          </button>
        </div>
      </Container>
    </div>
  );
}

// ==================== Empty State ====================

function DashboardEmpty() {
  return (
    <div className="min-h-screen bg-canvas-default py-12">
      <Container>
        <div className="bg-white rounded-2xl border border-ink-200 p-8 text-center">
          <p className="text-ink-600">Connect your wallet to view dashboard</p>
        </div>
      </Container>
    </div>
  );
}
