import { useState } from 'react';
import {
  Calendar,
  Check,
  CheckCircle2,
  Circle,
  Flag,
  Folder,
  Pencil,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { motion } from 'motion/react';
import { Task, TaskCategory, TaskPriority, TaskStatus } from '../types/task';
import {
  formatDueDate,
  formatTaskDate,
  getTodayDateISO,
  isTaskOverdue,
} from '../utils/storage';

interface TaskCardProps {
  task: Task;
  onToggleStatus: (id: string) => Promise<void>;
  onEditTask: (task: Task) => void;
  onDeleteTask: (id: string) => Promise<void>;
}

const PRIORITY_TEXT_CLASS: Record<TaskPriority, string> = {
  [TaskPriority.High]: 'text-rose-400',
  [TaskPriority.Medium]: 'text-amber-400',
  [TaskPriority.Low]: 'text-[#3B82F6]',
};

const CATEGORY_TEXT_CLASS: Record<TaskCategory, string> = {
  [TaskCategory.Personal]: 'text-violet-300',
  [TaskCategory.College]: 'text-blue-300',
  [TaskCategory.Work]: 'text-emerald-300',
};

export function TaskCard({
  task,
  onToggleStatus,
  onEditTask,
  onDeleteTask,
}: TaskCardProps) {
  const [isBusy, setIsBusy] = useState(false);

  const isCompleted = task.status === TaskStatus.Completed;
  const todayISO = getTodayDateISO();
  const overdue = isTaskOverdue(task, todayISO);

  const handleToggle = async () => {
    if (isBusy) return;
    setIsBusy(true);
    try {
      await onToggleStatus(task.id);
    } finally {
      setIsBusy(false);
    }
  };

  const handleDelete = async () => {
    if (isBusy) return;
    setIsBusy(true);
    try {
      await onDeleteTask(task.id);
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      className={`group rounded-2xl border p-5 transition-all duration-150 backdrop-blur-sm ${
        isCompleted
          ? 'border-white/[0.06] bg-[#171F35]/55'
          : 'border-white/[0.08] bg-[#171F35]/90 hover:-translate-y-0.5 hover:border-[#8B5CF6]/35 hover:shadow-lg hover:shadow-[#050814]/40'
      }`}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
        {isCompleted ? (
          <span className="inline-flex items-center gap-1.5 font-semibold text-[#10B981]">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>Completed</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 font-medium text-slate-300">
            <Circle className="h-3.5 w-3.5 shrink-0 text-[#8B5CF6]" aria-hidden="true" />
            <span>Pending</span>
          </span>
        )}

        <span className="text-slate-600" aria-hidden="true">
          ·
        </span>

        <span
          className={`inline-flex items-center gap-1 font-medium ${CATEGORY_TEXT_CLASS[task.category]}`}
        >
          <Folder className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>{task.category}</span>
        </span>

        <span className="text-slate-600" aria-hidden="true">
          ·
        </span>

        <span
          className={`inline-flex items-center gap-1 font-medium ${PRIORITY_TEXT_CLASS[task.priority]}`}
        >
          <Flag className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>{task.priority}</span>
        </span>

        <span className="text-slate-600" aria-hidden="true">
          ·
        </span>

        <span
          className={`inline-flex items-center gap-1 tabular-nums ${
            overdue ? 'font-medium text-rose-400' : 'text-slate-400'
          }`}
        >
          <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>
            {task.due_date
              ? `${overdue ? 'Overdue: ' : 'Due '}${formatDueDate(task.due_date)}`
              : `Added ${formatTaskDate(task.created_at)}`}
          </span>
        </span>
      </div>

      <h3
        className={`mt-2.5 font-display text-base font-semibold break-words ${
          isCompleted ? 'text-slate-400 line-through' : 'text-white'
        }`}
      >
        {task.title}
      </h3>

      {task.description && (
        <p
          className={`mt-1.5 text-sm leading-relaxed whitespace-pre-wrap break-words ${
            isCompleted ? 'text-slate-500' : 'text-slate-300'
          }`}
        >
          {task.description}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/[0.07] pt-3.5">
        <button
          type="button"
          onClick={handleToggle}
          disabled={isBusy}
          aria-label={
            isCompleted
              ? `Mark "${task.title}" as pending`
              : `Mark "${task.title}" as completed`
          }
          className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-medium transition-all duration-150 disabled:opacity-60 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6] ${
            isCompleted
              ? 'border border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.09] hover:text-white'
              : 'bg-[#10B981]/15 text-[#10B981] hover:bg-[#10B981]/25'
          }`}
        >
          {isCompleted ? (
            <>
              <RotateCcw className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Mark Pending</span>
            </>
          ) : (
            <>
              <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Mark Complete</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => onEditTask(task)}
          disabled={isBusy}
          aria-label={`Edit "${task.title}"`}
          className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2 text-sm font-medium text-slate-200 transition-colors duration-150 hover:bg-white/[0.09] hover:text-white disabled:opacity-60 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6]"
        >
          <Pencil className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Edit</span>
        </button>

        <button
          type="button"
          onClick={handleDelete}
          disabled={isBusy}
          aria-label={`Delete "${task.title}"`}
          className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2 text-sm font-medium text-rose-400 transition-colors duration-150 hover:border-rose-500/30 hover:bg-rose-500/15 disabled:opacity-60 whitespace-nowrap shrink-0 sm:ml-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
        >
          <Trash2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Delete</span>
        </button>
      </div>
    </motion.article>
  );
}
