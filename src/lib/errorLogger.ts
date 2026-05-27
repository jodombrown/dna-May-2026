/**
 * DNA Platform Error Logger
 * 
 * Centralized error logging to database with categorization and severity levels.
 * Helps catch issues early before users report them.
 */

import { supabase } from '@/integrations/supabase/client';

export type ErrorSeverity = 'warning' | 'error' | 'critical';

export type ErrorCategory = 
  | 'database'
  | 'authentication'
  | 'api'
  | 'ui'
  | 'navigation'
  | 'feed'
  | 'post_creation'
  | 'file_upload'
  | 'network'
  | 'composer'
  | 'unknown';

interface LogErrorOptions {
  error: Error | unknown;
  category: ErrorCategory;
  severity?: ErrorSeverity;
  context?: string;
  metadata?: Record<string, unknown>;
  componentStack?: string;
}

/**
 * Extract a human-readable message from an unknown error.
 * Use in catch blocks: catch (error: unknown) { const msg = getErrorMessage(error); }
 */
export function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  if (err && typeof err === 'object') {
    const anyErr = err as Record<string, unknown>;
    // Supabase PostgrestError shape: { message, details, hint, code }
    const parts = [anyErr.message, anyErr.details, anyErr.hint]
      .filter((v): v is string => typeof v === 'string' && v.length > 0);
    if (parts.length > 0) return parts.join(' - ');
  }
  return 'An unexpected error occurred';
}

/**
 * Main error logging function - sends errors to database
 */
export async function logError(options: LogErrorOptions): Promise<void> {
  const {
    error,
    category,
    severity = 'error',
    context,
    metadata = {},
    componentStack,
  } = options;

  try {
    // Extract error details - properly serialize non-Error objects
    const getErrorMessage = (err: unknown): string => {
      if (err instanceof Error) return err.message;
      if (typeof err === 'string') return err;
      if (err && typeof err === 'object') {
        try {
          return JSON.stringify(err, null, 2);
        } catch {
          return Object.prototype.toString.call(err);
        }
      }
      return String(err);
    };
    
    const errorMessage = getErrorMessage(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    const errorType = error instanceof Error ? error.name : typeof error;

    // Get user info if available
    const { data: { user } } = await supabase.auth.getUser();

    // Prepare metadata
    const enrichedMetadata = {
      ...metadata,
      category,
      context,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      userId: user?.id || null,
    };

    // Log to database
    const { error: dbError } = await supabase.from('error_logs').insert({
      error_message: errorMessage,
      error_stack: errorStack || null,
      error_type: errorType,
      severity,
      metadata: enrichedMetadata,
      component_stack: componentStack || null,
      user_id: user?.id || null,
      url: window.location.href,
      user_agent: navigator.userAgent,
    });

    if (dbError) {
      // If database logging fails, at least log to console
      console.error('Failed to log error to database:', dbError);
    }

    // Also log to console for development
    console.error(`[${severity.toUpperCase()}] ${category}:`, errorMessage, {
      stack: errorStack,
      metadata: enrichedMetadata,
    });

  } catch (loggingError) {
    // Fail silently but log to console
    console.error('Error logger failed:', loggingError);
    console.error('Original error:', error);
  }
}

/**
 * Convenience functions for different severity levels
 */
export const logCriticalError = (error: Error | unknown, category: ErrorCategory, context?: string, metadata?: Record<string, unknown>) =>
  logError({ error, category, severity: 'critical', context, metadata });

export const logHighError = (error: Error | unknown, category: ErrorCategory, context?: string, metadata?: Record<string, unknown>) =>
  logError({ error, category, severity: 'error', context, metadata });

export const logWarningError = (error: Error | unknown, category: ErrorCategory, context?: string, metadata?: Record<string, unknown>) =>
  logError({ error, category, severity: 'warning', context, metadata });

/**
 * Database query error wrapper
 * Use this to wrap all Supabase queries
 */
export async function withErrorLogging<T>(
  operation: () => Promise<T>,
  context: string,
  category: ErrorCategory = 'database'
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    await logHighError(error, category, context, {
      operation: context,
    });
    throw error; // Re-throw so the UI can handle it
  }
}

/**
 * React Query error handler
 * Use this in onError callbacks
 */
export function handleQueryError(error: unknown, queryKey: string) {
  logHighError(error, 'api', `Query failed: ${queryKey}`, {
    queryKey,
  });
}
