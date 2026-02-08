"use client";

import { useCurrentAccount, useSuiClient } from "@mysten/dapp-kit";
import { useQuery } from "@tanstack/react-query";
import { PACKAGE_ID, STABLE_COIN_TYPE } from "@/config/sui";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { Container } from "@/components/layout/Container";
import { DashboardOverview } from "@/components/dashboard/DashboardOverview";
import { VaultManagement } from "@/components/dashboard/VaultManagement";
import { DonationManager } from "@/components/dashboard/DonationManager";
import { MyProjectsManager } from "@/components/dashboard/MyProjectsManager";
import { ProjectsView } from "@/components/projects/ProjectsView";
import { EmptyStateCard } from "@/components/dashboard/EmptyStateCard";
import { useVaultData } from "@/hooks/useVaultData";
import { useProjects } from "@/hooks/useProjects";
import { useVaultOperations } from "@/hooks/useVaultOperations";
import { useMockData } from "@/contexts/MockDataContext";
import { Button } from "@/components/ui/Button";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { Vault } from "@/types/vault";

export default function Home() {
  const account = useCurrentAccount();
  const suiClient = useSuiClient();
  const { createVault, isLoading: isCreatingVault } = useVaultOperations();
  const { hasMockVault, mockVault, createMockVault } = useMockData();
  const searchParams = useSearchParams();
  const viewProjects = searchParams.get('view') === 'projects';
  const viewDashboard = searchParams.get('view') === 'dashboard';
  
  // Dashboard tab state
  const [dashboardTab, setDashboardTab] = useState<'overview' | 'my-projects'>('overview');

  // Fetch user's vault
  const { data: userVaults, isLoading: isLoadingVaults } = useQuery({
    queryKey: ['userVaults', account?.address],
    queryFn: async () => {
      if (!account) return [];
      const objects = await suiClient.getOwnedObjects({
        owner: account.address,
        filter: { StructType: `${PACKAGE_ID}::vault::Vault<${STABLE_COIN_TYPE}>` }
      });
      return objects.data;
    },
    enabled: !!account
  });

  const vaultId = userVaults?.[0]?.data?.objectId;
  const { data: vault, isLoading: isLoadingVaultData } = useVaultData(vaultId || null);
  const { data: projects, refetch: refetchProjects, isRefetching, isLoading: isLoadingProjects, error: projectsError } = useProjects();

  // Use mock vault if enabled, otherwise use real vault
  const displayVault = hasMockVault ? mockVault : vault;
  const displayVaultId = hasMockVault ? (mockVault?.id) : vaultId;

  const handleCreateMockVault = () => {
    if (account) {
      createMockVault(account.address);
    }
  };

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
          <div className="mb-8">
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

          {/* Dashboard Tab Navigation */}
          {account && (
            <div className="mb-8">
              <div className="border-b border-ink-300/20">
                <nav className="flex space-x-8" aria-label="Dashboard tabs">
                  <button
                    onClick={() => setDashboardTab('overview')}
                    className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      dashboardTab === 'overview'
                        ? 'border-ink-900 text-ink-900'
                        : 'border-transparent text-ink-500 hover:text-ink-700 hover:border-ink-300'
                    }`}
                  >
                    Overview
                  </button>
                  <button
                    onClick={() => setDashboardTab('my-projects')}
                    className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      dashboardTab === 'my-projects'
                        ? 'border-ink-900 text-ink-900'
                        : 'border-transparent text-ink-500 hover:text-ink-700 hover:border-ink-300'
                    }`}
                  >
                    My Projects
                  </button>
                </nav>
              </div>
            </div>
          )}

          {isLoadingVaults ? (
            <div className="flex items-center justify-center py-24">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-ink-300 border-t-ink-900 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-ink-500">Loading vault...</p>
              </div>
            </div>
          ) : account ? (
            <>
              {dashboardTab === 'overview' ? (
                <>
                  {/* No Vault Banner */}
                  {!displayVaultId && (
                    <div className="mb-8">
                      <EmptyStateCard
                        icon={
                          <svg className="w-16 h-16 text-ink-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10.5v6m3-3H9m4.06-7.19l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                          </svg>
                        }
                        title="Create Your Vault"
                        description="You don't have a vault yet. Create one to start depositing funds and supporting projects with sustainable yield."
                        actionLabel="Create Vault Now (Demo)"
                        onAction={handleCreateMockVault}
                        isLoading={isCreatingVault}
                        variant="minimal"
                      />
                    </div>
                  )}

                  {/* Dashboard Overview Stats */}
                  {displayVault ? (
                    <DashboardOverview 
                      vault={displayVault}
                      projects={projects || []}
                      totalDonated={BigInt(0)}
                    />
                  ) : (
                    // Mock stats when no vault
                    <div className="mb-8">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {[
                          { name: 'Vault Balance', value: '$0.00', desc: 'Create vault to deposit', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z', bg: 'bg-canvas-sand' },
                          { name: 'Estimated Yield', value: '$0.00', desc: 'Start earning with deposits', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6', bg: 'bg-canvas-sage' },
                          { name: 'Total Donated', value: '$0.00', desc: 'Support projects to begin', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z', bg: 'bg-canvas-rose' },
                          { name: 'Active Projects', value: '0', desc: 'Projects you support', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10', bg: 'bg-canvas-slate' },
                        ].map((stat) => (
                          <div key={stat.name} className={`${stat.bg} rounded-2xl p-6 border border-ink-300/20 opacity-60`}>
                            <div className="flex items-center justify-between mb-4">
                              <svg className="w-6 h-6 text-ink-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} />
                              </svg>
                            </div>
                            <div>
                              <p className="text-xs text-ink-500 uppercase tracking-wide mb-1">{stat.name}</p>
                              <p className="text-2xl font-serif text-ink-900 mb-1">{stat.value}</p>
                              <p className="text-xs text-ink-600">{stat.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Main Dashboard Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Column - Vault Management */}
                    <div className="space-y-6">
                      {displayVault ? (
                        <VaultManagement vault={displayVault} />
                      ) : (
                        // Mock Vault Management UI with overlay
                        <div className="bg-surface rounded-2xl p-6 border border-ink-300/20 shadow-sm opacity-60 relative min-h-[400px]">
                          <EmptyStateCard
                            icon={
                              <svg className="w-12 h-12 text-ink-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10.5v6m3-3H9m4.06-7.19l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                              </svg>
                            }
                            title="Vault Required"
                            description="Create a vault to deposit funds and manage your yield"
                            actionLabel="Create Vault (Demo)"
                            onAction={handleCreateMockVault}
                            isLoading={isCreatingVault}
                            variant="overlay"
                          />
                          {/* Background content for visual context */}
                          <div className="flex items-center justify-between mb-6">
                            <div>
                              <h3 className="text-xl font-serif text-ink-900">Vault Management</h3>
                              <p className="text-sm text-ink-500 mt-1">Deposit, withdraw, and manage your funds</p>
                            </div>
                            <div className="bg-canvas-sage px-3 py-1.5 rounded-full">
                              <span className="text-xs font-medium text-ink-900">APY: 5.2%</span>
                            </div>
                          </div>
                          <div className="mb-6 p-5 rounded-xl bg-canvas-default border border-ink-300/20">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="text-xs text-ink-500 uppercase tracking-wide mb-2">Vault Balance</p>
                                <p className="text-3xl font-serif text-ink-900">$0.00</p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-ink-500 uppercase tracking-wide mb-2">Wallet Balance</p>
                                <p className="text-lg font-serif text-ink-700">$0.00</p>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-4 h-64"></div>
                        </div>
                      )}
                    </div>

                    {/* Right Column - Donation Configuration (larger) */}
                    <div>
                      {displayVault ? (
                        <DonationManager 
                          vault={displayVault}
                          projects={projects || []}
                        />
                      ) : (
                        // Mock Donation Manager with overlay
                        <div className="opacity-60 relative min-h-[500px]">
                          <EmptyStateCard
                            icon={
                              <svg className="w-12 h-12 text-ink-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                              </svg>
                            }
                            title="Vault Required"
                            description="Create a vault to configure your donation allocations"
                            variant="overlay"
                          />
                          {/* Background content for visual context */}
                          <div className="bg-surface rounded-3xl p-8 border border-ink-300/20">
                            <h2 className="text-2xl font-serif text-ink-900 mb-2">Donation Configuration</h2>
                            <p className="text-sm text-ink-500 mb-6">
                              Allocate a percentage of your yield to support projects
                            </p>
                            <div className="space-y-5 h-64"></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                // My Projects Tab
                <MyProjectsManager userAddress={account.address} />
              )}
            </>
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
