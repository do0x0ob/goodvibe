"use client";

import { useProject } from "@/hooks/useProjects";
import { ManagePanel } from "@/components/project/ManagePanel";
import { Container } from "@/components/layout/Container";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function ManageProjectPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const { data: project, isLoading, error: projectError } = useProject(projectId);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-canvas-default flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-2 border-ink-900 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-sm text-ink-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (projectError) {
    return (
      <div className="min-h-screen bg-canvas-default flex items-center justify-center">
        <div className="text-center">
          <p className="text-ink-900 font-medium mb-2">Error loading project</p>
          <p className="text-sm text-ink-600 mb-4">{(projectError as Error).message}</p>
          <Link href="/?view=projects" className="text-sm text-ink-600 hover:text-ink-900 underline">
            Browse all projects
          </Link>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-canvas-default flex items-center justify-center">
        <div className="text-center">
          <p className="text-ink-900 font-medium mb-2">Project not found</p>
          <Link href="/?view=projects" className="text-sm text-ink-600 hover:text-ink-900 underline">
            Browse all projects
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="bg-canvas-default min-h-screen pt-24 pb-12">
      <Container className="max-w-4xl">
        {/* Breadcrumb Navigation */}
        <div className="mb-6">
          <Link 
            href={`/project/${projectId}`} 
            className="inline-flex items-center gap-2 text-sm text-ink-600 hover:text-ink-900 transition-colors group"
          >
            <svg className="w-4 h-4 transform group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Project
          </Link>
        </div>

        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-start gap-4 mb-4">
            {project.imageUrl && (
              <img
                src={project.imageUrl}
                alt={project.title}
                className="w-20 h-20 rounded-2xl object-cover border border-ink-300/20 shadow-sm"
              />
            )}
            <div className="flex-1">
              <h1 className="text-3xl font-serif text-ink-900 mb-2">{project.title}</h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-ink-600">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-canvas-subtle rounded-full border border-ink-300/30">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  {project.category}
                </span>
                <span className="font-medium">${(Number(project.raisedAmount) / 1_000_000).toFixed(2)} raised</span>
                <span>{project.supporterCount} supporters</span>
              </div>
            </div>
          </div>
        </div>

        {/* Manage Panel */}
        <ManagePanel projectId={projectId} projectCapId="" />
      </Container>
    </main>
  );
}
