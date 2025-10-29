/**
 * Utility functions for demos feature components
 */

import { Demo, DEMO_STATUSES } from './types';

/**
 * Validates demo data
 */
export function validateDemo(demo: Partial<Demo>): string[] {
  const errors: string[] = [];

  if (!demo.name?.trim()) {
    errors.push('Demo name is required');
  }

  if (demo.name && demo.name.length > 100) {
    errors.push('Demo name must be less than 100 characters');
  }

  if (demo.description && demo.description.length > 500) {
    errors.push('Demo description must be less than 500 characters');
  }

  if (demo.status && !DEMO_STATUSES.includes(demo.status as any)) {
    errors.push('Invalid demo status');
  }

  if (demo.cta_url && !isValidUrl(demo.cta_url)) {
    errors.push('Invalid CTA URL');
  }

  return errors;
}

/**
 * Validates a URL
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Formats demo for display
 */
export function formatDemoForDisplay(demo: Demo): {
  name: string;
  description: string;
  status: string;
  statusColor: string;
  createdAt: string;
  updatedAt: string;
} {
  return {
    name: demo.name,
    description: demo.description || 'No description',
    status: demo.status.charAt(0).toUpperCase() + demo.status.slice(1),
    statusColor: getStatusColor(demo.status),
    createdAt: formatDate(demo.created_at),
    updatedAt: formatDate(demo.updated_at),
  };
}

/**
 * Gets color class for demo status
 */
export function getStatusColor(status: Demo['status']): string {
  switch (status) {
    case 'active':
      return 'text-green-600 bg-green-100';
    case 'inactive':
      return 'text-gray-600 bg-gray-100';
    case 'draft':
      return 'text-yellow-600 bg-yellow-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
}

/**
 * Formats date for display
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Sorts demos by various criteria
 */
export function sortDemos(
  demos: Demo[], 
  sortBy: 'name' | 'created_at' | 'updated_at' | 'status',
  order: 'asc' | 'desc' = 'desc'
): Demo[] {
  return [...demos].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'created_at':
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        break;
      case 'updated_at':
        comparison = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
        break;
      case 'status':
        comparison = a.status.localeCompare(b.status);
        break;
    }
    
    return order === 'asc' ? comparison : -comparison;
  });
}

/**
 * Filters demos by status
 */
export function filterDemosByStatus(
  demos: Demo[], 
  status: Demo['status'] | 'all'
): Demo[] {
  if (status === 'all') return demos;
  return demos.filter(demo => demo.status === status);
}

/**
 * Searches demos by name or description
 */
export function searchDemos(demos: Demo[], query: string): Demo[] {
  if (!query.trim()) return demos;
  
  const lowercaseQuery = query.toLowerCase();
  return demos.filter(demo => 
    demo.name.toLowerCase().includes(lowercaseQuery) ||
    (demo.description && demo.description.toLowerCase().includes(lowercaseQuery))
  );
}

/**
 * Generates a unique demo name
 */
export function generateDemoName(existingNames: string[]): string {
  let counter = 1;
  let name = `Demo ${counter}`;
  
  while (existingNames.includes(name)) {
    counter++;
    name = `Demo ${counter}`;
  }
  
  return name;
}

/**
 * Calculates demo statistics
 */
export function calculateDemoStats(demos: Demo[]): {
  total: number;
  active: number;
  inactive: number;
  draft: number;
  activePercentage: number;
} {
  const total = demos.length;
  const active = demos.filter(d => d.status === 'active').length;
  const inactive = demos.filter(d => d.status === 'inactive').length;
  const draft = demos.filter(d => d.status === 'draft').length;
  const activePercentage = total > 0 ? Math.round((active / total) * 100) : 0;
  
  return {
    total,
    active,
    inactive,
    draft,
    activePercentage,
  };
}

/**
 * Exports demos to CSV
 */
export function exportDemosToCSV(demos: Demo[]): string {
  const headers = ['Name', 'Description', 'Status', 'Created At', 'Updated At', 'CTA URL'];
  const rows = demos.map(demo => [
    demo.name,
    demo.description || '',
    demo.status,
    demo.created_at,
    demo.updated_at,
    demo.cta_url || '',
  ]);
  
  const csvContent = [headers, ...rows]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n');
  
  return csvContent;
}