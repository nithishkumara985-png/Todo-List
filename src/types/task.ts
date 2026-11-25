export enum TaskStatus {
  Pending = 'pending',
  Completed = 'completed',
}

export enum TaskCategory {
  Personal = 'Personal',
  College = 'College',
  Work = 'Work',
}

export enum TaskPriority {
  High = 'High',
  Medium = 'Medium',
  Low = 'Low',
}

export enum FilterOption {
  All = 'all',
  Pending = 'pending',
  Completed = 'completed',
}

export enum TaskSortOption {
  Newest = 'newest',
  DueDate = 'due_date',
  Priority = 'priority',
  Title = 'title',
}

export enum NavSection {
  Dashboard = 'dashboard',
  MyTasks = 'my-tasks',
  Today = 'today',
  Upcoming = 'upcoming',
  Completed = 'completed',
  Analytics = 'analytics',
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  category: TaskCategory;
  priority: TaskPriority;
  due_date: string | null;
  created_at: string;
  user_id: string;
}

export interface TaskFormValues {
  title: string;
  description: string;
  category: TaskCategory;
  priority: TaskPriority;
  due_date: string;
  status: TaskStatus;
}

export interface TaskValidationErrors {
  title?: string;
  description?: string;
  due_date?: string;
}

export interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message?: string;
}

export const TITLE_MAX_LENGTH = 120;
export const DESCRIPTION_MAX_LENGTH = 500;

export const TASK_CATEGORIES: TaskCategory[] = [
  TaskCategory.Personal,
  TaskCategory.College,
  TaskCategory.Work,
];

export const TASK_PRIORITIES: TaskPriority[] = [
  TaskPriority.High,
  TaskPriority.Medium,
  TaskPriority.Low,
];

export function validateTaskInput(
  title: string,
  description: string,
  dueDate?: string
): TaskValidationErrors {
  const errors: TaskValidationErrors = {};
  const trimmedTitle = title.trim();
  const trimmedDescription = description.trim();

  if (!trimmedTitle) {
    errors.title = 'Please enter a task title.';
  } else if (trimmedTitle.length < 2) {
    errors.title = 'Task title must be at least 2 characters.';
  } else if (trimmedTitle.length > TITLE_MAX_LENGTH) {
    errors.title = `Task title cannot exceed ${TITLE_MAX_LENGTH} characters.`;
  }

  if (trimmedDescription.length > DESCRIPTION_MAX_LENGTH) {
    errors.description = `Description cannot exceed ${DESCRIPTION_MAX_LENGTH} characters.`;
  }

  if (dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
    errors.due_date = 'Please select a valid due date.';
  }

  return errors;
}
