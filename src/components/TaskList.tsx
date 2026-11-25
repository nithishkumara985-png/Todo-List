import { ClipboardList, SearchX } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { FilterOption, Task } from '../types/task';
import { EmptyState } from './EmptyState';
import { TaskCard } from './TaskCard';

interface TaskListProps {
  tasks: Task[];
  totalTaskCount: number;
  isLoading: boolean;
  activeFilter: FilterOption;
  searchQuery: string;
  emptyHeading?: string;
  emptyDescription?: string;
  onToggleStatus: (id: string) => Promise<void>;
  onEditTask: (task: Task) => void;
  onDeleteTask: (id: string) => Promise<void>;
  onResetFilters: () => void;
  onNewTaskClick: () => void;
}

export function TaskList({
  tasks,
  totalTaskCount,
  isLoading,
  activeFilter,
  searchQuery,
  emptyHeading,
  emptyDescription,
  onToggleStatus,
  onEditTask,
  onDeleteTask,
  onResetFilters,
  onNewTaskClick,
}: TaskListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3" aria-busy="true" aria-label="Loading tasks">
        {[1, 2, 3].map((item) => (
          <div
            key={item}
            className="animate-pulse rounded-2xl border border-white/[0.08] bg-[#171F35]/70 p-5"
          >
            <div className="h-3 w-52 rounded bg-white/10" />
            <div className="mt-3 h-5 w-2/3 rounded bg-white/10" />
            <div className="mt-2 h-4 w-full rounded bg-white/5" />
            <div className="mt-4 flex gap-2 border-t border-white/[0.06] pt-3.5">
              <div className="h-9 w-28 rounded-xl bg-white/5" />
              <div className="h-9 w-20 rounded-xl bg-white/5" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (totalTaskCount === 0) {
    return (
      <EmptyState
        icon={ClipboardList}
        title={emptyHeading ?? 'No tasks in your workspace yet'}
        description={
          emptyDescription ??
          'Start organizing your day by creating your first task with a category, priority level, and due date.'
        }
        primaryActionLabel="Create First Task"
        onPrimaryAction={onNewTaskClick}
      />
    );
  }

  if (tasks.length === 0) {
    const trimmedQuery = searchQuery.trim();
    let heading = emptyHeading ?? 'No matching tasks found';
    let description =
      emptyDescription ??
      'Try clearing your search or adjusting your status, category, or priority filters.';

    if (trimmedQuery) {
      heading = `No tasks match "${trimmedQuery}"`;
      description =
        activeFilter === FilterOption.All
          ? 'No task titles or descriptions match your search query.'
          : `No ${activeFilter} tasks match your search. Try switching back to All or clearing the search.`;
    } else if (!emptyHeading && activeFilter === FilterOption.Pending) {
      heading = 'All caught up on pending tasks';
      description = 'Every task in this view is already completed.';
    } else if (!emptyHeading && activeFilter === FilterOption.Completed) {
      heading = 'No completed tasks yet';
      description = 'Complete a pending task to track your progress here.';
    }

    return (
      <EmptyState
        icon={SearchX}
        title={heading}
        description={description}
        secondaryActionLabel="Reset Filters"
        onSecondaryAction={onResetFilters}
        primaryActionLabel="Add New Task"
        onPrimaryAction={onNewTaskClick}
      />
    );
  }

  return (
    <div className="space-y-3" role="region" aria-label="Task list">
      <AnimatePresence initial={false}>
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onToggleStatus={onToggleStatus}
            onEditTask={onEditTask}
            onDeleteTask={onDeleteTask}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
