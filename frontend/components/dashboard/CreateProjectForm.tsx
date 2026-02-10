'use client';

import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { useProjectOperations } from '@/hooks/useProjectOperations';
import toast from 'react-hot-toast';

interface CreateProjectFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const CATEGORIES = [
  'Environment',
  'Wildlife',
  'Education',
  'Healthcare',
  'Technology',
  'Community',
  'Arts & Culture',
  'Research',
] as const;

/**
 * 創建項目表單
 * 包含所有必要的項目信息輸入
 */
export const CreateProjectForm: React.FC<CreateProjectFormProps> = ({
  onSuccess,
  onCancel,
}) => {
  const { createProject, isLoading } = useProjectOperations();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Environment' as string,
    imageUrl: '',
  });

  const [imagePreviewError, setImagePreviewError] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 基本驗證
    if (!formData.title.trim()) {
      toast.error('Project title is required');
      return;
    }

    if (!formData.description.trim()) {
      toast.error('Project description is required');
      return;
    }

    const result = await createProject({
      title: formData.title.trim(),
      description: formData.description.trim(),
      category: formData.category,
      imageUrl: formData.imageUrl.trim() || 'https://via.placeholder.com/800x400',
    });

    if (result.success) {
      // 重置表單
      setFormData({
        title: '',
        description: '',
        category: 'Environment',
        imageUrl: '',
      });
      setImagePreviewError(false);
      onSuccess?.();
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-ink-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-ink-100 bg-canvas-subtle/50">
        <h3 className="text-xl font-serif font-bold text-ink-900">
          Create New Project
        </h3>
        <p className="text-sm text-ink-500 mt-1">
          Share your vision with the community
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-bold text-ink-900 mb-2 uppercase tracking-wide">
            Project Title *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="block w-full rounded-xl border-ink-200 bg-ink-50/30 px-4 py-3 text-lg font-medium focus:border-ink-900 focus:ring-ink-900/10 placeholder:text-ink-300 transition-all"
            placeholder="e.g., Ocean Cleanup Initiative"
            required
            disabled={isLoading}
            maxLength={100}
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-bold text-ink-900 mb-2 uppercase tracking-wide">
            Category *
          </label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="block w-full rounded-xl border-ink-200 bg-ink-50/30 px-4 py-3 focus:border-ink-900 focus:ring-ink-900/10 transition-all"
            required
            disabled={isLoading}
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-bold text-ink-900 mb-2 uppercase tracking-wide">
            Description *
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={6}
            className="block w-full rounded-xl border-ink-200 bg-ink-50/30 px-4 py-3 focus:border-ink-900 focus:ring-ink-900/10 placeholder:text-ink-300 resize-y min-h-[150px] transition-all"
            placeholder="Describe your project, its goals, and how the funds will be used..."
            required
            disabled={isLoading}
            maxLength={1000}
          />
          <p className="text-xs text-ink-400 mt-2">
            {formData.description.length}/1000 characters
          </p>
        </div>

        {/* Cover Image URL */}
        <div>
          <label className="block text-sm font-bold text-ink-900 mb-2 uppercase tracking-wide">
            Cover Image URL
          </label>
          <input
            type="url"
            value={formData.imageUrl}
            onChange={(e) => {
              setFormData({ ...formData, imageUrl: e.target.value });
              setImagePreviewError(false);
            }}
            className="block w-full rounded-xl border-ink-200 bg-ink-50/30 px-4 py-3 focus:border-ink-900 focus:ring-ink-900/10 placeholder:text-ink-300 transition-all"
            placeholder="https://example.com/image.jpg"
            disabled={isLoading}
          />
          
          {/* Image Preview */}
          {formData.imageUrl && !imagePreviewError && (
            <div className="mt-3">
              <img
                src={formData.imageUrl}
                alt="Preview"
                className="w-full h-48 object-cover rounded-xl border border-ink-200"
                onError={() => setImagePreviewError(true)}
              />
            </div>
          )}
          
          {imagePreviewError && (
            <p className="text-sm text-red-600 mt-2">
              Unable to load image. Please check the URL.
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-ink-100">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-ink-500 hover:text-ink-900 hover:bg-ink-50 transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
          )}
          <Button
            type="submit"
            disabled={isLoading}
            className="px-8 py-2.5 rounded-xl bg-ink-900 text-white font-bold hover:bg-ink-800 transition-all shadow-lg shadow-ink-900/20"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg
                  className="animate-spin h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Creating...
              </span>
            ) : (
              'Create Project'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};
