'use client';

import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { toast } from 'react-hot-toast';

interface ManagePanelProps {
  projectId: string;
  projectCapId: string;
}

interface ProgressUpdate {
  id: string;
  title: string;
  content: string;
  date: string;
}

export const ManagePanel: React.FC<ManagePanelProps> = ({ projectId }) => {
  const [activeTab, setActiveTab] = useState<'updates' | 'new'>('updates');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
  });

  // Mock 已發布的 updates
  const [updates, setUpdates] = useState<ProgressUpdate[]>([
    {
      id: '1',
      title: 'Project Kickoff',
      content: 'We are excited to announce the official start of our project! Thank you to all our early supporters.',
      date: '2024-01-15',
    },
    {
      id: '2',
      title: 'First Milestone Reached',
      content: 'Thanks to your support, we have completed the initial research phase and are moving forward with implementation.',
      date: '2024-02-01',
    },
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      const newUpdate: ProgressUpdate = {
        id: Date.now().toString(),
        title: formData.title,
        content: formData.content,
        date: new Date().toISOString().split('T')[0],
      };

      setUpdates([newUpdate, ...updates]);
      setFormData({ title: '', content: '' });
      setActiveTab('updates');
      toast.success('Progress update posted successfully');
    } catch (error) {
      toast.error('Failed to post update');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-ink-300/20">
        <nav className="flex gap-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('updates')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'updates'
                ? 'border-ink-900 text-ink-900'
                : 'border-transparent text-ink-500 hover:text-ink-700 hover:border-ink-300'
            }`}
          >
            Progress Updates ({updates.length})
          </button>
          <button
            onClick={() => setActiveTab('new')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'new'
                ? 'border-ink-900 text-ink-900'
                : 'border-transparent text-ink-500 hover:text-ink-700 hover:border-ink-300'
            }`}
          >
            Post New Update
          </button>
        </nav>
      </div>

      {activeTab === 'updates' ? (
        // Updates List
        <div className="space-y-4">
          {updates.length === 0 ? (
            <div className="text-center py-16 bg-surface rounded-2xl border border-dashed border-ink-300/30">
              <svg className="w-12 h-12 text-ink-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm text-ink-500 mb-4">No progress updates yet</p>
              <Button onClick={() => setActiveTab('new')} size="sm" variant="outline">
                Post Your First Update
              </Button>
            </div>
          ) : (
            updates.map((update) => (
              <div
                key={update.id}
                className="bg-surface rounded-2xl p-6 border border-ink-300/20 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-serif text-xl text-ink-900 mb-2">
                      {update.title}
                    </h3>
                    <p className="text-xs text-ink-500 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {new Date(update.date).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                  <span className="text-xs font-medium text-ink-600 bg-canvas-sage px-3 py-1.5 rounded-full">
                    Published
                  </span>
                </div>
                <p className="text-sm text-ink-700 leading-relaxed whitespace-pre-wrap">
                  {update.content}
                </p>
              </div>
            ))
          )}
        </div>
      ) : (
        // New Update Form
        <form onSubmit={handleSubmit} className="bg-surface rounded-2xl p-8 border border-ink-300/20 shadow-sm">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-ink-900 mb-2">
                Update Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="block w-full rounded-xl border border-ink-300/30 px-4 py-3 focus:border-ink-900 focus:ring-2 focus:ring-ink-900/10 text-base bg-white transition-all placeholder:text-ink-400"
                placeholder="e.g. First Milestone Completed"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-900 mb-2">
                Update Content
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={10}
                className="block w-full rounded-xl border border-ink-300/30 px-4 py-3 focus:border-ink-900 focus:ring-2 focus:ring-ink-900/10 text-base bg-white transition-all resize-none placeholder:text-ink-400"
                placeholder="Share your progress, achievements, challenges, and what's coming next..."
                required
              />
              <p className="mt-2 text-xs text-ink-500">
                Be transparent and engaging. Your supporters want to know how their contributions are making a difference.
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                type="submit" 
                className="flex-1"
                isLoading={isSubmitting}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Publishing...' : 'Publish Update'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setFormData({ title: '', content: '' });
                  setActiveTab('updates');
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};
