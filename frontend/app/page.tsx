"use client";

import { useCurrentAccount } from "@mysten/dapp-kit";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { Container } from "@/components/layout/Container";
import { DashboardOverview } from "@/components/dashboard/DashboardOverview";
import { MyProjectsManager } from "@/components/dashboard/MyProjectsManager";
import { ProjectsView } from "@/components/projects/ProjectsView";
import { EmptyStateCard } from "@/components/dashboard/EmptyStateCard";
import { useProjects } from "@/hooks/useProjects";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useState, Suspense } from "react";
import { useDashboardData } from "@/hooks/useDashboardData";

function HomeContent() {
  const account = useCurrentAccount();
  const searchParams = useSearchParams();
  const viewProjects = searchParams.get('view') === 'projects';
  const viewDashboard = searchParams.get('view') === 'dashboard';

  const { data: dashboardData } = useDashboardData();
  const { data: projects, refetch: refetchProjects, isRefetching, isLoading: isLoadingProjects, error: projectsError } = useProjects();


  // --- Explore Projects View (available to everyone) ---
  if (viewProjects) {
    return (
      <main className="bg-canvas-default min-h-screen pt-24 pb-12">
        <Container>
          {/* Back to Home */}
          <div className="mb-6">
            <Link href="/" className="inline-flex items-center text-sm font-medium text-ink-500 hover:text-ink-900 transition-colors group">
              <svg className="w-4 h-4 mr-1.5 transform group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Home
            </Link>
          </div>
          
          {/* Page Header */}
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-serif text-ink-900 mb-3">Explore Projects</h1>
            <p className="text-lg text-ink-700 max-w-2xl mx-auto">
              Discover initiatives making a real impact. Support projects that align with your values through sustainable yield donation.
            </p>
          </div>

          <ProjectsView 
            projects={projects || []}
            isLoading={isLoadingProjects}
            error={projectsError as Error | null}
            onRefetch={refetchProjects}
            isRefetching={isRefetching}
          />
        </Container>
      </main>
    );
  }

  // --- Dashboard View (only when explicitly requested via ?view=dashboard) ---
  if (viewDashboard) {
    return (
      <main className="bg-canvas-default min-h-screen pt-24 pb-12">
        <Container>
          {/* Back to Home */}
          <div className="mb-8">
            <Link href="/" className="inline-flex items-center text-sm font-medium text-ink-500 hover:text-ink-900 transition-colors group">
              <svg className="w-4 h-4 mr-1.5 transform group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Home
            </Link>
          </div>

          {/* Page Header */}
          <div className="mb-12">
            <h1 className="text-4xl font-serif text-ink-900 mb-2">Dashboard</h1>
            <p className="text-lg text-ink-500">
              {account 
                ? `Welcome back, ${account.address.slice(0, 6)}...${account.address.slice(-4)}`
                : 'Connect your wallet to get started'
              }
            </p>
          </div>

          {/* Wallet Connection Prompt */}
          {!account && (
            <div className="mb-8">
              <EmptyStateCard
                icon={
                  <svg className="w-16 h-16 text-ink-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
                  </svg>
                }
                title="Connect Your Wallet"
                description="Please connect your Sui wallet to access the Dashboard and manage your donations."
                variant="minimal"
              />
            </div>
          )}

          {account ? (
            <div className="mt-8">
              <DashboardOverview />
            </div>
          ) : null}
        </Container>
      </main>
    );
  }

  // --- Landing Page (default, not connected, no view param) ---
  return (
    <main className="bg-canvas-default min-h-screen">
      <Hero />
      <Features />
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <main className="bg-canvas-default min-h-screen">
        <Hero />
        <Features />
      </main>
    }>
      <HomeContent />
    </Suspense>
  );
}
