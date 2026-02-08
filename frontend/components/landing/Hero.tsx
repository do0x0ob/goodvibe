'use client';

import React, { useState, useEffect } from 'react';
import { Container } from '../layout/Container';
import { Button } from '../ui/Button';
import Link from 'next/link';

export const Hero: React.FC = () => {
  const [showScrollIndicator, setShowScrollIndicator] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setShowScrollIndicator(false);
      } else {
        setShowScrollIndicator(true);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-canvas-default flex items-center relative">
      <Container>
        <div className="pt-20 pb-8">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h1 className="text-5xl font-serif font-medium tracking-tight text-ink-900 sm:text-6xl mb-6">
            Fund Projects, Earn Yield
          </h1>
          <p className="text-xl leading-8 text-ink-700 font-sans mb-10 max-w-xl mx-auto">
            GoodVibe allows you to deposit USDC into a vault, earn yield through Stable Layer, and automatically donate a portion of your yield to projects you care about.
          </p>
          
          <div className="flex items-center justify-center gap-x-6">
            <Link href="/?view=projects">
              <Button size="lg" className="rounded-full px-8">
                Explore Projects
              </Button>
            </Link>
            <Link href="/?view=dashboard">
              <Button variant="outline" size="lg" className="rounded-full px-8 border-ink-900 text-ink-900 hover:bg-ink-900 hover:text-white transition-colors">
                Go to Dashboard
              </Button>
            </Link>
          </div>
        </div>

        {/* StableLayer Section (Slate Blue Block) */}
        <div className="bg-canvas-slate rounded-3xl p-8 md:p-12 mb-16">
          <div className="grid md:grid-cols-12 gap-12 items-start">
            <div className="md:col-span-4">
              <h2 className="text-4xl font-serif text-ink-900 mb-4">Powered by StableLayer</h2>
              <p className="text-ink-700 text-lg">
                GoodVibe leverages StableLayer's yield infrastructure to generate sustainable returns from your USDC deposits. Learn more about the technology behind our platform.
              </p>
            </div>
            
            <div className="md:col-span-8 grid sm:grid-cols-2 gap-6">
              {/* StableLayer Website Card */}
              <a href="https://stablelayer.site/" target="_blank" rel="noopener noreferrer" className="bg-surface-slate/50 p-8 rounded-xl hover:bg-surface-slate transition-colors cursor-pointer group">
                <div className="text-sm font-medium text-ink-500 mb-2 uppercase tracking-wide">Website</div>
                <h3 className="text-2xl font-serif text-ink-900 mb-12 group-hover:text-ink-700">StableLayer</h3>
                <div className="flex justify-end">
                  <span className="text-2xl group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </a>

              {/* StableLayer Documentation Card */}
              <a href="https://docs.stablelayer.site/" target="_blank" rel="noopener noreferrer" className="bg-surface-slate/50 p-8 rounded-xl hover:bg-surface-slate transition-colors cursor-pointer group">
                <div className="text-sm font-medium text-ink-500 mb-2 uppercase tracking-wide">Documentation</div>
                <h3 className="text-2xl font-serif text-ink-900 mb-12 group-hover:text-ink-700">Litepaper</h3>
                <div className="flex justify-end">
                  <span className="text-2xl group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </a>
            </div>
          </div>
        </div>
        
        {/* Scroll Indicator */}
        {showScrollIndicator && (
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce transition-opacity duration-300">
            <svg className="w-5 h-5 text-ink-300 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        )}
        </div>
      </Container>
    </div>
  );
};
