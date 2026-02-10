'use client';

import React from 'react';
import Link from 'next/link';
import { useSupportRecord } from '@/hooks/useSupportRecord';
import { useSuiClient } from '@mysten/dapp-kit';
import { useQuery } from '@tanstack/react-query';
import { formatBalance } from '@/utils/formatters';

interface SupportedProjectsListProps {
  className?: string;
}

export const SupportedProjectsList: React.FC<SupportedProjectsListProps> = ({ className = '' }) => {
  const client = useSuiClient();
  const { supportedProjects, isLoading: isLoadingProjects } = useSupportRecord();

  const { data: projectDetails, isLoading: isLoadingDetails } = useQuery({
    queryKey: ['supportedProjectsDetails', supportedProjects.map(p => p.projectId)],
    queryFn: async () => {
      if (supportedProjects.length === 0) return [];

      const details = await Promise.all(
        supportedProjects.map(async (project) => {
          try {
            const obj = await client.getObject({
              id: project.projectId,
              options: { showContent: true },
            });

            if (obj.data?.content && 'fields' in obj.data.content) {
              const fields = obj.data.content.fields as any;
              const metadata = fields.metadata.fields;

              return {
                projectId: project.projectId,
                projectName: new TextDecoder().decode(
                  new Uint8Array(metadata.title)
                ),
                supportAmount: project.amount,
              };
            }
          } catch (error) {
          }

          return {
            projectId: project.projectId,
            projectName: 'Unknown Project',
            supportAmount: project.amount,
          };
        })
      );

      return details;
    },
    enabled: supportedProjects.length > 0,
  });

  const isLoading = isLoadingProjects || isLoadingDetails;

  const totalSupport = projectDetails?.reduce(
    (sum, p) => sum + p.supportAmount,
    BigInt(0)
  ) || BigInt(0);

  return (
    <div className={`rounded-3xl p-8 lg:p-12 h-full ${className}`}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
        {/* Left Section - Text Info */}
        <div className="lg:col-span-4 flex flex-col justify-between space-y-8">
          <div>
            <h2 className="text-3xl font-serif font-medium text-ink-900 mb-6 leading-tight">
              Your<br />Impact
            </h2>
            <p className="text-ink-600 text-sm leading-relaxed max-w-sm">
              You are currently supporting <span className="text-ink-900 font-bold">{supportedProjects.length}</span> projects.
            </p>
          </div>
          
          <div className="hidden lg:block">
            <p className="text-xs font-bold text-ink-400 uppercase tracking-widest mb-2">Total Supported</p>
            <p className="text-3xl font-serif text-ink-900">${formatBalance(totalSupport)}</p>
          </div>
        </div>

        {/* Right Section - Cards Grid */}
        <div className="lg:col-span-8">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <div key={i} className="h-40 bg-white/20 rounded-2xl animate-pulse"></div>
              ))}
            </div>
          ) : !projectDetails || projectDetails.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-8 bg-white/40 rounded-3xl border border-white/50 text-center">
              <p className="text-ink-600 mb-4 text-sm">You haven't supported any projects yet.</p>
              <Link 
                href="/?view=projects"
                className="text-ink-900 font-bold text-sm underline decoration-2 underline-offset-4 hover:text-ink-700"
              >
                Explore Projects →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full content-start">
              {projectDetails.map((project) => (
                <Link 
                  key={project.projectId} 
                  href={`/project/${project.projectId}`}
                  className="group block"
                >
                  <div className="bg-white/40 hover:bg-white/80 transition-all duration-300 rounded-2xl p-5 h-full min-h-[160px] flex flex-col justify-between border border-transparent hover:border-white hover:shadow-sm">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-bold tracking-widest text-ink-500 uppercase">
                        Supporting
                      </span>
                      <span className="text-xs font-medium bg-ink-900/5 px-2 py-1 rounded text-ink-600">
                        ${formatBalance(project.supportAmount)}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-xl font-serif text-ink-900 group-hover:translate-x-1 transition-transform duration-300">
                        {project.projectName}
                      </h3>
                    </div>

                    <div className="flex justify-end">
                      <div className="w-8 h-8 rounded-full bg-ink-900/5 flex items-center justify-center group-hover:bg-ink-900 group-hover:text-white transition-all">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
        
        {/* Mobile Total Display */}
        <div className="lg:hidden mt-4 pt-6 border-t border-ink-900/5">
          <p className="text-xs font-bold text-ink-400 uppercase tracking-widest mb-2">Total Supported</p>
          <p className="text-3xl font-serif text-ink-900">${formatBalance(totalSupport)}</p>
        </div>
      </div>
    </div>
  );
};
