import { Task, TaskPriority, TaskSortOption, TaskStatus } from '../types/task';

export function formatTaskDate(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDueDate(dateStr: string | null): string {
  if (!dateStr) {
    return 'No due date';
  }
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) {
    return dateStr;
  }
  const [year, month, day] = parts;
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function getLocalDateISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getTodayDateISO(): string {
  return getLocalDateISO(new Date());
}

export function formatTodayHeading(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function isCreatedToday(createdAtIso: string, todayISO: string): boolean {
  const date = new Date(createdAtIso);
  if (Number.isNaN(date.getTime())) {
    return false;
  }
  return getLocalDateISO(date) === todayISO;
}

export function isTaskForToday(task: Task, todayISO: string): boolean {
  if (task.due_date) {
    return task.due_date === todayISO;
  }
  return isCreatedToday(task.created_at, todayISO);
}

export function isTaskUpcoming(task: Task, todayISO: string): boolean {
  if (!task.due_date) {
    return false;
  }
  return task.due_date > todayISO && task.status === TaskStatus.Pending;
}

export function isTaskOverdue(task: Task, todayISO: string): boolean {
  if (task.status === TaskStatus.Completed || !task.due_date) {
    return false;
  }
  return task.due_date < todayISO;
}

export function getDisplayNameFromEmail(email?: string): string {
  if (!email) {
    return 'there';
  }
  const localPart = email.split('@')[0] || '';
  const cleaned = localPart.replace(/[._-]+/g, ' ').trim();
  if (!cleaned) {
    return email;
  }
  return cleaned
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

const PRIORITY_WEIGHT: Record<TaskPriority, number> = {
  [TaskPriority.High]: 0,
  [TaskPriority.Medium]: 1,
  [TaskPriority.Low]: 2,
};

export function sortTasks(tasks: Task[], sortBy: TaskSortOption): Task[] {
  const copy = [...tasks];
  copy.sort((a, b) => {
    if (sortBy === TaskSortOption.Priority) {
      const diff = PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority];
      if (diff !== 0) return diff;
      return b.created_at.localeCompare(a.created_at);
    }

    if (sortBy === TaskSortOption.DueDate) {
      if (a.due_date && b.due_date) {
        const diff = a.due_date.localeCompare(b.due_date);
        if (diff !== 0) return diff;
      } else if (a.due_date && !b.due_date) {
        return -1;
      } else if (!a.due_date && b.due_date) {
        return 1;
      }
      return PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority];
    }

    if (sortBy === TaskSortOption.Title) {
      return a.title.localeCompare(b.title);
    }

    // Default: Newest first
    return b.created_at.localeCompare(a.created_at);
  });
  return copy;
}

export interface DailyProductivityPoint {
  dateISO: string;
  label: string;
  shortDate: string;
  total: number;
  completed: number;
  pending: number;
}

export function buildWeeklyProductivityData(
  tasks: Task[]
): DailyProductivityPoint[] {
  const days: DailyProductivityPoint[] = [];
  const today = new Date();

  for (let offset = 6; offset >= 0; offset -= 1) {
    const dayDate = new Date(today);
    dayDate.setDate(today.getDate() - offset);
    const dateISO = getLocalDateISO(dayDate);

    const dayTasks = tasks.filter((task) => {
      if (task.due_date) {
        return task.due_date === dateISO;
      }
      const created = new Date(task.created_at);
      if (Number.isNaN(created.getTime())) {
        return false;
      }
      return getLocalDateISO(created) === dateISO;
    });

    const completed = dayTasks.filter(
      (t) => t.status === TaskStatus.Completed
    ).length;
    const total = dayTasks.length;

    days.push({
      dateISO,
      label: dayDate.toLocaleDateString('en-US', { weekday: 'short' }),
      shortDate: dayDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      total,
      completed,
      pending: total - completed,
    });
  }

  return days;
}
