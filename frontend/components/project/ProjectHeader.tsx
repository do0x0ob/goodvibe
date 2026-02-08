import React from 'react';
import { Project } from '@/types/project';
import { Container } from '../layout/Container';
import { formatAddress, formatBalance } from '@/utils/formatters';

interface ProjectHeaderProps {
  project: Project;
}

export const ProjectHeader: React.FC<ProjectHeaderProps> = ({ project }) => {
  return (
    <div className="bg-canvas-default pb-8 pt-6">
      <Container>
        <div className="md:flex md:items-center md:justify-between md:space-x-5">
          <div className="flex items-start space-x-5">
            <div className="pt-1.5">
              <h1 className="text-3xl font-serif font-medium text-ink-900">{project.title}</h1>
              <p className="text-sm font-sans text-ink-500 mt-1">
                Created by {formatAddress(project.creator)}
              </p>
            </div>
          </div>
          <div className="mt-6 flex flex-col-reverse justify-stretch space-y-4 space-y-reverse sm:flex-row-reverse sm:justify-end sm:space-y-0 sm:space-x-3 sm:space-x-reverse md:mt-0 md:flex-row md:space-x-3">
             <div className="text-right">
                <p className="text-sm font-medium text-ink-500 uppercase tracking-wide">Raised</p>
                <p className="text-3xl font-serif font-medium text-ink-900">${formatBalance(project.raisedAmount)}</p>
             </div>
          </div>
        </div>
        <div className="mt-8">
            {project.imageUrl && (
                <div className="w-full h-96 overflow-hidden rounded-xl bg-canvas-subtle mb-8">
                    <img src={project.imageUrl} alt={project.title} className="w-full h-full object-cover" />
                </div>
            )}
            <div className="max-w-3xl">
                <div className="prose prose-lg text-ink-700 font-serif leading-relaxed">
                    <p>{project.description}</p>
                </div>
                <div className="mt-6 flex flex-wrap gap-2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-canvas-subtle text-ink-700 uppercase tracking-wide">
                        {project.category}
                    </span>
                </div>
            </div>
        </div>
      </Container>
    </div>
  );
};
