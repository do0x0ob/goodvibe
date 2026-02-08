'use client';

import React from 'react';
import { Container } from '../layout/Container';
import { Vault } from '@/types/vault';
import { Project } from '@/types/project';
import { formatBalance } from '@/utils/formatters';

interface DashboardOverviewProps {
  vault: Vault;
  projects: Project[];
  totalDonated: bigint;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({ 
  vault, 
  projects,
  totalDonated 
}) => {
  // Calculate statistics
  const totalYield = vault.balance * BigInt(5) / BigInt(100); // 假設 5% 年化收益
  const activeProjects = projects?.length || 0;

  const stats = [
    {
      name: 'Vault Balance',
      value: `$${formatBalance(vault.balance)}`,
      description: 'Total USDC deposited',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
      bgColor: 'bg-canvas-sand',
      iconColor: 'text-ink-700',
    },
    {
      name: 'Estimated Yield',
      value: `$${formatBalance(totalYield)}`,
      description: 'Annual yield (5.2% APY)',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      bgColor: 'bg-canvas-sage',
      iconColor: 'text-ink-700',
    },
    {
      name: 'Total Donated',
      value: `$${formatBalance(totalDonated)}`,
      description: 'To supported projects',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
      bgColor: 'bg-canvas-rose',
      iconColor: 'text-ink-700',
    },
    {
      name: 'Active Projects',
      value: activeProjects.toString(),
      description: 'Projects you support',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      bgColor: 'bg-canvas-slate',
      iconColor: 'text-ink-700',
    },
  ];

  return (
    <div className="mb-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className={`${stat.bgColor} rounded-2xl p-6 border border-ink-300/20 hover:shadow-md transition-shadow`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.iconColor}`}>
                {stat.icon}
              </div>
            </div>
            <div>
              <p className="text-xs text-ink-500 uppercase tracking-wide mb-1">
                {stat.name}
              </p>
              <p className="text-2xl font-serif text-ink-900 mb-1">
                {stat.value}
              </p>
              <p className="text-xs text-ink-600">
                {stat.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
