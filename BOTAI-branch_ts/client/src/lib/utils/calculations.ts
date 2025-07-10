/**
 * Utility functions for risk score calculations and data processing
 */

import { TaskPriority } from "@shared/schema";

/**
 * Calculate days remaining until due date
 * @param dueDate The due date
 * @returns Object with days and status color
 */
export function calculateDaysRemaining(dueDate: string | Date): { 
  days: number;
  text: string;
  color: string;
} {
  const today = new Date();
  const dueDateObj = new Date(dueDate);
  const diffTime = dueDateObj.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return {
      days: Math.abs(diffDays),
      text: `${Math.abs(diffDays)} days overdue`,
      color: 'text-danger-600'
    };
  } else if (diffDays === 0) {
    return {
      days: 0,
      text: 'Due today',
      color: 'text-warning-600'
    };
  } else if (diffDays === 1) {
    return {
      days: 1,
      text: '1 day remaining',
      color: 'text-warning-600'
    };
  } else if (diffDays <= 3) {
    return {
      days: diffDays,
      text: `${diffDays} days remaining`,
      color: 'text-warning-600'
    };
  } else {
    return {
      days: diffDays,
      text: `${diffDays} days remaining`,
      color: 'text-neutral-600'
    };
  }
}

/**
 * Calculate due date based on priority
 * @param priority Task priority
 * @returns Due date
 */
export function calculateDueDate(priority: string): Date {
  const now = new Date();
  const daysToAdd = 
    priority === TaskPriority.CRITICAL ? 3 : 
    priority === TaskPriority.HIGH ? 5 : 
    priority === TaskPriority.MEDIUM ? 7 : 10;
  
  now.setDate(now.getDate() + daysToAdd);
  return now;
}

/**
 * Calculate risk level based on score
 * @param score Risk score (0-100)
 * @returns Risk level string
 */
export function calculateRiskLevel(score: number): 'Low' | 'Medium' | 'High' | 'Critical' {
  if (score < 30) return 'Low';
  if (score < 60) return 'Medium';
  if (score < 80) return 'High';
  return 'Critical';
}

/**
 * Helper to get colors for different risk levels
 * @param level Risk level string
 * @returns Object with badge and background colors
 */
export function getRiskLevelColors(level: string): { badge: string, bg: string, text: string } {
  switch (level) {
    case 'Critical':
      return { 
        badge: 'bg-danger-100 text-danger-800',
        bg: 'bg-danger-500',
        text: 'text-danger-500'
      };
    case 'High':
      return { 
        badge: 'bg-warning-100 text-warning-800',
        bg: 'bg-warning-500',
        text: 'text-warning-500'
      };
    case 'Medium':
      return { 
        badge: 'bg-blue-100 text-blue-800',
        bg: 'bg-blue-500',
        text: 'text-blue-500'
      };
    case 'Low':
      return { 
        badge: 'bg-green-100 text-green-800',
        bg: 'bg-green-500',
        text: 'text-green-500'
      };
    default:
      return { 
        badge: 'bg-neutral-100 text-neutral-800',
        bg: 'bg-neutral-500',
        text: 'text-neutral-500'
      };
  }
}

/**
 * Generate simulated risk trend data for the past N days
 * @param days Number of days of history to generate
 * @returns Array of data points with date and risk counts
 */
export function generateRiskTrendData(days: number): Array<{
  date: string;
  critical: number;
  high: number;
  medium: number;
  low: number;
}> {
  const result = [];
  const today = new Date();
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Generate some reasonable values that might occur in real usage
    // Values increase somewhat over time to show a trend
    const dayOffset = days - i;
    const critical = Math.max(0, Math.floor(2 + Math.random() * 3 + dayOffset / 20));
    const high = Math.max(0, Math.floor(3 + Math.random() * 4 + dayOffset / 15));
    const medium = Math.max(0, Math.floor(5 + Math.random() * 5 + dayOffset / 10));
    const low = Math.max(0, Math.floor(3 + Math.random() * 6 + dayOffset / 12));
    
    result.push({
      date: date.toISOString().split('T')[0],
      critical,
      high,
      medium,
      low
    });
  }
  
  return result;
}

/**
 * Generate simulated task completion data for the past N days
 * @param days Number of days of history to generate
 * @returns Array of data points with date and task counts
 */
export function generateTaskCompletionData(days: number): Array<{
  date: string;
  completed: number;
  created: number;
}> {
  const result = [];
  const today = new Date();
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Generate some reasonable values that might occur in real usage
    const dayOfWeek = date.getDay();
    const weekendFactor = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.5 : 1;
    
    // Values that make sense for a clinical trial
    const created = Math.floor((3 + Math.random() * 5) * weekendFactor);
    const completed = Math.floor((2 + Math.random() * 5) * weekendFactor);
    
    result.push({
      date: date.toISOString().split('T')[0],
      completed,
      created
    });
  }
  
  return result;
}
