'use client';

import React from 'react';
import { ConnectButton, useCurrentAccount } from '@mysten/dapp-kit';
import Link from 'next/link';

export const Header: React.FC = () => {
  const account = useCurrentAccount();
  
  return (
    <header className="bg-canvas-default/80 backdrop-blur-md border-b border-ink-300/20 fixed top-0 w-full z-40 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center group">
              <span className="text-2xl font-serif font-medium text-ink-900 group-hover:text-ink-700 transition-colors">
                GoodVibe
              </span>
            </Link>
            <nav className="hidden md:flex space-x-6">
              <Link href="/?view=projects" className="text-sm font-medium text-ink-500 hover:text-ink-900 transition-colors">
                Projects
              </Link>
              {account && (
                <Link href="/?view=dashboard" className="text-sm font-medium text-ink-500 hover:text-ink-900 transition-colors">
                  Dashboard
                </Link>
              )}
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <ConnectButton connectText="Connect Wallet" className="!bg-ink-900 !text-white !rounded-lg !px-5 !py-2.5 !font-serif !font-medium hover:!bg-ink-700 transition-all shadow-sm" />
          </div>
        </div>
      </div>
    </header>
  );
};
