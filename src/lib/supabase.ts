import { createClient, PostgrestError, SupabaseClient } from '@supabase/supabase-js';
import { Task, TaskCategory, TaskPriority, TaskStatus } from '../types/task';

const rawSupabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() ?? '';
const rawSupabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? '';

export const BASE_TASK_COLUMNS =
  'id, title, description, status, created_at, user_id';
export const EXTENDED_TASK_COLUMNS =
  'id, title, description, status, category, priority, due_date, created_at, user_id';

export const TASKS_MIGRATION_SQL = `alter table public.tasks
  add column if not exists category text not null default 'Personal'
    check (category in ('Personal', 'College', 'Work')),
  add column if not exists priority text not null default 'Medium'
    check (priority in ('High', 'Medium', 'Low')),
  add column if not exists due_date date null;`;

function getConfigError(): string | null {
  const missing: string[] = [];
  if (!rawSupabaseUrl) {
    missing.push('VITE_SUPABASE_URL');
  }
  if (!rawSupabaseAnonKey) {
    missing.push('VITE_SUPABASE_ANON_KEY');
  }

  if (missing.length > 0) {
    return `Missing Supabase environment variable${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}.`;
  }

  if (
    !rawSupabaseUrl.startsWith('https://') &&
    !rawSupabaseUrl.startsWith('http://')
  ) {
    return 'VITE_SUPABASE_URL must be a valid http(s) URL (for example, https://your-project.supabase.co).';
  }

  return null;
}

export const supabaseConfigError: string | null = getConfigError();
export const isSupabaseConfigured = supabaseConfigError === null;

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(rawSupabaseUrl, rawSupabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

function isPostgrestError(error: unknown): error is PostgrestError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    'code' in error
  );
}

export function isMissingColumnError(error: unknown): boolean {
  if (!isPostgrestError(error)) {
    return false;
  }
  const msg = (error.message || '').toLowerCase();
  return (
    error.code === 'PGRST204' ||
    error.code === '42703' ||
    msg.includes('column') && msg.includes('does not exist') ||
    msg.includes('could not find the')
  );
}

export function normalizeTaskRow(raw: unknown): Task {
  const row =
    typeof raw === 'object' && raw !== null
      ? (raw as Record<string, unknown>)
      : {};
  const rawCategory = String(row.category ?? '');
  const category = Object.values(TaskCategory).includes(
    rawCategory as TaskCategory
  )
    ? (rawCategory as TaskCategory)
    : TaskCategory.Personal;

  const rawPriority = String(row.priority ?? '');
  const priority = Object.values(TaskPriority).includes(
    rawPriority as TaskPriority
  )
    ? (rawPriority as TaskPriority)
    : TaskPriority.Medium;

  const rawStatus = String(row.status ?? '').toLowerCase();
  const status =
    rawStatus === TaskStatus.Completed
      ? TaskStatus.Completed
      : TaskStatus.Pending;

  return {
    id: String(row.id ?? ''),
    title: String(row.title ?? ''),
    description: typeof row.description === 'string' ? row.description : '',
    status,
    category,
    priority,
    due_date: typeof row.due_date === 'string' && row.due_date ? row.due_date : null,
    created_at: String(row.created_at ?? ''),
    user_id: String(row.user_id ?? ''),
  };
}

export function formatSupabaseError(error: unknown, action: string): string {
  if (isPostgrestError(error)) {
    const code = error.code ? ` [${error.code}]` : '';
    const msg = error.message || 'Unknown database error';
    const lowerMsg = msg.toLowerCase();

    if (
      error.code === '42501' ||
      lowerMsg.includes('row-level security') ||
      lowerMsg.includes('rls')
    ) {
      return `Permission denied while ${action}${code}: Row-Level Security (RLS) policy blocked this operation. Verify that your Supabase "tasks" table allows authenticated users where auth.uid() = user_id.`;
    }

    if (error.code === '42P01' || lowerMsg.includes('does not exist')) {
      return `Database schema error while ${action}${code}: ${msg}. Verify that the "tasks" table exists and includes the required columns.`;
    }

    if (error.code === 'PGRST204' || error.code === '42703') {
      return `Column mismatch while ${action}${code}: ${msg}. Run the SQL migration to add category, priority, and due_date columns.`;
    }

    if (error.code === '23502') {
      return `Missing required field while ${action}${code}: ${msg}.`;
    }

    const details = error.details ? ` (${error.details})` : '';
    const hint = error.hint ? ` Hint: ${error.hint}` : '';
    return `Failed while ${action}${code}: ${msg}${details}${hint}`;
  }

  if (error instanceof Error) {
    return `Failed while ${action}: ${error.message}`;
  }

  return `Unexpected error while ${action}.`;
}
