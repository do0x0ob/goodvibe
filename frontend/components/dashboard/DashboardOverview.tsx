'use client';

import React from 'react';
import { BtcUSDCPanel } from './BtcUSDCPanel';
import { SupportedProjectsList } from './SupportedProjectsList';
import { MyProjectsManager } from './MyProjectsManager';
import { useCurrentAccount } from '@mysten/dapp-kit';

export const DashboardOverview: React.FC = () => {
  const account = useCurrentAccount();
  const userAddress = account?.address;

  if (!userAddress) return null;

  return (
    <div className="space-y-6">
      {/* 
         New Grid Layout: 12 Columns
         Left (8 cols):
           Top Row: Wallet (4) + Did You Know (4)
           Bottom Row: Your Impact (8)
         Right (4 cols):
           My Projects (Vertical Full Height)
      */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 auto-rows-fr">
        
        {/* --- Left Column Group (Spans 8 cols) --- */}
        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6 auto-rows-min">
          
          {/* Wallet Balance */}
          <div className="min-h-[240px]">
            <BtcUSDCPanel />
          </div>

          {/* Did you know */}
          <div className="bg-canvas-rose rounded-3xl p-8 flex flex-col justify-center min-h-[240px]">
            <h3 className="text-2xl font-serif font-bold text-ink-900 mb-3">Did you know?</h3>
            <p className="text-ink-800 text-sm leading-relaxed font-medium">
              By keeping your USDC in Stable Layer, you are automatically earning yield that supports your favorite projects. 
              You can withdraw your principal at any time without penalty.
            </p>
          </div>

          {/* Your Impact (Spans 2 cols of the inner grid -> Full width of left block) */}
          <div className="md:col-span-2 min-h-[320px]">
             <SupportedProjectsList className="bg-canvas-subtle h-full" />
          </div>
        </div>

        {/* --- Right Column Group (Spans 4 cols) --- */}
        <div className="lg:col-span-4 h-full min-h-[584px]"> {/* Align height with left column stack */}
           <MyProjectsManager userAddress={userAddress} className="bg-canvas-sage h-full" />
        </div>
        
      </div>
    </div>
  );
};
