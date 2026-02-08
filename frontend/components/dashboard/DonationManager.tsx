'use client';

import React, { useMemo } from 'react';
import { Button } from '../ui/Button';
import { Project } from '@/types/project';
import { Vault } from '@/types/vault';
import { useMockData } from '@/contexts/MockDataContext';
import Link from 'next/link';

interface DonationManagerProps {
  vault: Vault;
  projects: Project[];
}

export const DonationManager: React.FC<DonationManagerProps> = ({ vault, projects }) => {
  const {
    globalDonationPercentage,
    setGlobalDonationPercentage: setGlobalPercentage,
    allocations,
    updateAllocation,
    removeAllocation,
    hasUnsavedChanges,
    setHasUnsavedChanges,
    saveConfiguration,
  } = useMockData();

  const [isSaving, setIsSaving] = React.useState(false);
  
  // 從 vault balance 計算實際金額
  const vaultBalanceUSD = useMemo(() => {
    return Number(vault.balance) / 1_000_000;
  }, [vault.balance]);

  const estimatedAnnualYield = useMemo(() => {
    return vaultBalanceUSD * 0.052; // 5.2% APY
  }, [vaultBalanceUSD]);

  const donationPool = useMemo(() => {
    return estimatedAnnualYield * (globalDonationPercentage / 100);
  }, [estimatedAnnualYield, globalDonationPercentage]);

  const retainedYield = useMemo(() => {
    return estimatedAnnualYield - donationPool;
  }, [estimatedAnnualYield, donationPool]);

  const handleRemoveAllocation = (projectId: string) => {
    removeAllocation(projectId);
  };

  const handleSaveConfiguration = async () => {
    setIsSaving(true);
    try {
      await saveConfiguration();
      // Show success toast
    } catch (error) {
      console.error('Failed to save configuration:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const totalAllocation = allocations.reduce((sum, a) => sum + a.percentage, 0);
  const remainingAllocation = 100 - totalAllocation;
  const isValidConfiguration = totalAllocation === 100 && globalDonationPercentage > 0;

  return (
    <div className="bg-surface rounded-3xl p-8 border border-ink-300/20 shadow-lg">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-xl font-serif text-ink-900 mb-2">Donation Configuration</h3>
            <p className="text-sm text-ink-600 leading-relaxed max-w-2xl">
              Configure your sustainable giving strategy. Set how much of your yield to donate, then adjust allocation percentages across your selected projects.
            </p>
          </div>
          {hasUnsavedChanges && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-canvas-sand rounded-full">
              <div className="w-2 h-2 bg-accent-primary rounded-full animate-pulse"></div>
              <span className="text-xs font-medium text-ink-700">Unsaved changes</span>
            </div>
          )}
        </div>
      </div>

      {/* Step 1: Global Donation Percentage */}
      <div className="mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-ink-900 text-white text-xs font-semibold flex-shrink-0">1</span>
            <div>
              <h3 className="text-base font-serif text-ink-900">Global Yield Donation</h3>
              <p className="text-xs text-ink-600 mt-0.5">% of total yield to donate</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              max="100"
              step="5"
              value={globalDonationPercentage}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (val >= 0 && val <= 100) {
                  setGlobalPercentage(val);
                  setHasUnsavedChanges(true);
                }
              }}
              className="w-20 rounded-lg border border-ink-300/30 py-2 px-3 text-center text-base font-serif focus:border-ink-900 focus:ring-1 focus:ring-ink-900 bg-white text-ink-900 transition-colors"
            />
            <span className="text-ink-500 text-sm">%</span>
          </div>
        </div>

        {globalDonationPercentage > 0 && (
          <div className="mt-4 ml-9 flex items-center justify-between p-3 bg-canvas-sage/20 rounded-lg border border-ink-300/20 text-sm">
            <div>
              <span className="text-ink-600">Donation Pool: </span>
              <span className="font-serif font-semibold text-ink-900">${donationPool.toFixed(2)}/yr</span>
            </div>
            <div>
              <span className="text-ink-600">You Keep: </span>
              <span className="font-serif font-semibold text-ink-700">${retainedYield.toFixed(2)}/yr</span>
            </div>
          </div>
        )}
      </div>

      {/* Step 2: Allocation Table */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-ink-900 text-white text-xs font-semibold">2</span>
          <div>
            <h3 className="text-base font-serif text-ink-900">Allocate to Projects</h3>
            <p className="text-xs text-ink-600">
              Distribute your donation pool ({globalDonationPercentage > 0 ? `$${donationPool.toFixed(2)}/yr` : '$0/yr'})
            </p>
          </div>
        </div>

        {allocations.length === 0 ? (
          <div className="p-8 bg-canvas-subtle rounded-2xl border border-ink-300/20 text-center">
            <p className="text-sm text-ink-600 mb-3">No projects added yet</p>
            <Link href="/?view=projects">
              <Button variant="outline" size="sm">Browse Projects</Button>
            </Link>
          </div>
        ) : (
          <>
            {/* Allocation Table */}
            <div className="border border-ink-300/20 rounded-xl overflow-hidden bg-white">
              {/* Table Header */}
              <div className="grid grid-cols-[1fr_120px_120px_40px] gap-4 px-4 py-3 bg-canvas-subtle border-b border-ink-300/20 text-xs font-medium text-ink-600 uppercase tracking-wide">
                <div>Project</div>
                <div className="text-right">Allocation %</div>
                <div className="text-right">Annual Amount</div>
                <div></div>
              </div>

              {/* Table Rows */}
              {allocations.map((allocation, index) => {
                const project = projects.find(p => p.id === allocation.projectId);
                if (!project) return null;

                const annualAmount = (donationPool * allocation.percentage) / 100;
                const isOverLimit = totalAllocation > 100;

                return (
                  <div 
                    key={allocation.projectId}
                    className={`grid grid-cols-[1fr_120px_120px_40px] gap-4 px-4 py-3 items-center ${
                      index < allocations.length - 1 ? 'border-b border-ink-300/10' : ''
                    } hover:bg-canvas-subtle/50 transition-colors`}
                  >
                    {/* Project Name */}
                    <div className="flex items-center gap-2 min-w-0">
                      <Link href={`/project/${project.id}`} className="hover:underline truncate text-sm text-ink-900">
                        {project.title}
                      </Link>
                    </div>

                    {/* Percentage Input */}
                    <div className="flex items-center gap-1 justify-end">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="5"
                        value={allocation.percentage}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          if (val >= 0 && val <= 100) {
                            updateAllocation(allocation.projectId, val);
                            setHasUnsavedChanges(true);
                          }
                        }}
                        className={`w-16 rounded-lg border py-1.5 px-2 text-center text-sm font-serif focus:border-ink-900 focus:ring-1 focus:ring-ink-900 bg-white transition-colors ${
                          isOverLimit ? 'border-red-500 text-red-700' : 'border-ink-300/30 text-ink-900'
                        }`}
                      />
                      <span className="text-xs text-ink-500">%</span>
                    </div>

                    {/* Annual Amount */}
                    <div className="text-right text-sm font-serif text-ink-700">
                      ${annualAmount.toFixed(2)}
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => {
                        removeAllocation(allocation.projectId);
                        setHasUnsavedChanges(true);
                      }}
                      className="text-ink-400 hover:text-red-600 transition-colors"
                      title="Remove project"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                );
              })}

              {/* Table Footer - Total */}
              <div className="grid grid-cols-[1fr_120px_120px_40px] gap-4 px-4 py-3 bg-canvas-sage/20 border-t border-ink-300/20">
                <div className="text-sm font-medium text-ink-900">Total Allocated</div>
                <div className="text-right">
                  <span className={`text-sm font-serif font-semibold ${
                    totalAllocation > 100 ? 'text-red-700' : totalAllocation === 100 ? 'text-green-700' : 'text-ink-900'
                  }`}>
                    {totalAllocation}%
                  </span>
                </div>
                <div className="text-right text-sm font-serif font-semibold text-ink-900">
                  ${(donationPool * totalAllocation / 100).toFixed(2)}
                </div>
                <div></div>
              </div>
            </div>

            {/* Validation Message */}
            {totalAllocation > 100 && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-red-800">
                  Total allocation exceeds 100%. Please adjust percentages.
                </p>
              </div>
            )}

            {totalAllocation < 100 && totalAllocation > 0 && (
              <div className="mt-3 p-3 bg-canvas-sand/50 border border-ink-300/20 rounded-lg">
                <p className="text-xs text-ink-600">
                  💡 You have {100 - totalAllocation}% unallocated. The remaining ${(donationPool * (100 - totalAllocation) / 100).toFixed(2)}/yr will stay in your donation pool.
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Save Configuration Button */}
      <div className="pt-6 border-t border-ink-300/20">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            {isValidConfiguration ? (
              <p className="text-sm text-ink-600 flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Configuration complete and ready to save
              </p>
            ) : (
              <p className="text-sm text-ink-500">
                {globalDonationPercentage === 0 
                  ? 'Set your global donation percentage to get started'
                  : allocations.length === 0
                  ? 'Add projects from the Projects page to allocate your donation pool'
                  : totalAllocation !== 100
                  ? 'Total allocation must equal 100%'
                  : 'Complete your configuration to save'
                }
              </p>
            )}
          </div>
          <Button
            onClick={handleSaveConfiguration}
            isLoading={isSaving}
            disabled={!isValidConfiguration || !hasUnsavedChanges}
            size="lg"
            className="min-w-[200px]"
          >
            {isSaving ? 'Saving to Chain...' : 'Save Configuration'}
          </Button>
        </div>
      </div>
    </div>
  );
};
