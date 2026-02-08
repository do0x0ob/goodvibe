import React from 'react';
import { Card } from '../ui/Card';
import { useProjects } from '@/hooks/useProjects';
import { Project } from '@/types/project';
import Link from 'next/link';

export const ProjectList: React.FC = () => {
  const { data: projects, isLoading, error } = useProjects();

  if (isLoading) return <div className="text-ink-500 py-8 text-center">Loading projects...</div>;
  
  if (error) {
    console.error("Project fetching error:", error);
    return (
        <div className="text-red-500 py-8 text-center bg-red-50 rounded-lg">
            <p>Failed to load projects.</p>
            <p className="text-sm mt-2">{(error as Error).message}</p>
        </div>
    );
  }

  return (
    <div className="space-y-6">
      {(!projects || projects.length === 0) ? (
        <p className="text-ink-500 py-8 text-center">No projects found.</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project: Project) => (
            <Link key={project.id} href={`/project/${project.id}`}>
                <Card className="bg-transparent border-0 shadow-none hover:shadow-none p-0 group h-full flex flex-col">
                {project.imageUrl && (
                    <div className="overflow-hidden rounded-sm mb-4 bg-canvas-subtle relative pt-[60%] border border-ink-200">
                        <img 
                            src={project.imageUrl} 
                            alt={project.title} 
                            className="absolute inset-0 w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500" 
                        />
                    </div>
                )}
                <div className="flex flex-col flex-grow">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-mono text-ink-500 uppercase tracking-wide border border-ink-200 px-2 py-0.5 rounded-full">
                            {project.category}
                        </span>
                        <span className="text-xs text-ink-400 font-mono">
                            Jan 15, 2026
                        </span>
                    </div>
                    <h4 className="font-serif text-xl text-ink-900 group-hover:text-accent-primary transition-colors mb-2 leading-tight">
                        {project.title}
                    </h4>
                    <p className="text-sm text-ink-500 line-clamp-3 font-sans leading-relaxed mb-4 flex-grow">
                        {project.description}
                    </p>
                    
                    <div className="pt-4 border-t border-ink-200 mt-auto">
                        <span className="text-sm font-medium text-ink-900 group-hover:text-accent-primary flex items-center transition-colors">
                            Read more 
                            <svg className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                        </span>
                    </div>
                </div>
                </Card>
            </Link>
            ))}
        </div>
      )}
    </div>
  );
};
