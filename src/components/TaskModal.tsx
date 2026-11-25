import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, Check, Plus, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import {
  DESCRIPTION_MAX_LENGTH,
  TASK_CATEGORIES,
  TASK_PRIORITIES,
  TITLE_MAX_LENGTH,
  Task,
  TaskCategory,
  TaskFormValues,
  TaskPriority,
  TaskStatus,
  TaskValidationErrors,
  validateTaskInput,
} from '../types/task';

interface TaskModalProps {
  isOpen: boolean;
  editingTask: Task | null;
  defaultCategory?: TaskCategory;
  defaultDueDate?: string;
  schemaNeedsMigration?: boolean;
  onClose: () => void;
  onSave: (values: TaskFormValues, taskId?: string) => Promise<boolean>;
}

export function TaskModal({
  isOpen,
  editingTask,
  defaultCategory = TaskCategory.Personal,
  defaultDueDate = '',
  schemaNeedsMigration = false,
  onClose,
  onSave,
}: TaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TaskCategory>(defaultCategory);
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.Medium);
  const [dueDate, setDueDate] = useState(defaultDueDate);
  const [status, setStatus] = useState<TaskStatus>(TaskStatus.Pending);
  const [errors, setErrors] = useState<TaskValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const titleInputRef = useRef<HTMLInputElement | null>(null);
  const isEditMode = Boolean(editingTask);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (editingTask) {
      setTitle(editingTask.title);
      setDescription(editingTask.description);
      setCategory(editingTask.category);
      setPriority(editingTask.priority);
      setDueDate(editingTask.due_date ?? '');
      setStatus(editingTask.status);
    } else {
      setTitle('');
      setDescription('');
      setCategory(defaultCategory);
      setPriority(TaskPriority.Medium);
      setDueDate(defaultDueDate);
      setStatus(TaskStatus.Pending);
    }
    setErrors({});

    const timer = window.setTimeout(() => {
      titleInputRef.current?.focus();
    }, 60);

    return () => window.clearTimeout(timer);
  }, [isOpen, editingTask, defaultCategory, defaultDueDate]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, isSubmitting, onClose]);

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (errors.title) {
      const nextErrors = validateTaskInput(value, description, dueDate);
      setErrors((prev) => ({ ...prev, title: nextErrors.title }));
    }
  };

  const handleDescriptionChange = (value: string) => {
    setDescription(value);
    if (errors.description) {
      const nextErrors = validateTaskInput(title, value, dueDate);
      setErrors((prev) => ({ ...prev, description: nextErrors.description }));
    }
  };

  const handleDueDateChange = (value: string) => {
    setDueDate(value);
    if (errors.due_date) {
      const nextErrors = validateTaskInput(title, description, value);
      setErrors((prev) => ({ ...prev, due_date: nextErrors.due_date }));
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }

    const validationErrors = validateTaskInput(title, description, dueDate);
    if (
      validationErrors.title ||
      validationErrors.description ||
      validationErrors.due_date
    ) {
      setErrors(validationErrors);
      if (validationErrors.title) {
        titleInputRef.current?.focus();
      }
      return;
    }

    setIsSubmitting(true);
    try {
      const succeeded = await onSave(
        {
          title: title.trim(),
          description: description.trim(),
          category,
          priority,
          due_date: dueDate,
          status,
        },
        editingTask?.id
      );

      if (succeeded) {
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const titleLength = title.trim().length;
  const descriptionLength = description.trim().length;

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="task-modal-heading"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            onClick={() => {
              if (!isSubmitting) onClose();
            }}
            className="fixed inset-0 bg-[#050814]/75 backdrop-blur-sm"
            aria-hidden="true"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-2xl border border-white/12 bg-[#171F35] p-6 sm:p-7 shadow-2xl shadow-black/50"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id="task-modal-heading"
                  className="font-display text-lg sm:text-xl font-semibold text-white"
                >
                  {isEditMode ? 'Edit Task' : 'Create New Task'}
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  {isEditMode
                    ? 'Update task details, priority, due date, or status.'
                    : 'Capture a task with category, priority, and due date.'}
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                aria-label="Close task modal"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6]"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            {schemaNeedsMigration && (
              <p className="mt-4 rounded-xl border border-amber-500/25 bg-amber-500/10 px-3.5 py-2.5 text-xs text-amber-200 leading-relaxed">
                Category, priority, and due date will be persisted to Supabase
                after running the SQL migration shown on your workspace.
              </p>
            )}

            <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <label
                    htmlFor="modal-task-title"
                    className="block text-sm font-medium text-slate-200"
                  >
                    Task Title{' '}
                    <span className="text-rose-400" aria-hidden="true">
                      *
                    </span>
                  </label>
                  <span
                    className={`text-xs tabular-nums ${
                      titleLength > TITLE_MAX_LENGTH
                        ? 'font-medium text-rose-400'
                        : 'text-slate-500'
                    }`}
                  >
                    {titleLength}/{TITLE_MAX_LENGTH}
                  </span>
                </div>

                <input
                  ref={titleInputRef}
                  id="modal-task-title"
                  type="text"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  disabled={isSubmitting}
                  placeholder="e.g., Prepare Q4 product roadmap"
                  aria-required="true"
                  aria-invalid={Boolean(errors.title)}
                  aria-describedby={
                    errors.title ? 'modal-task-title-error' : undefined
                  }
                  className={`mt-1.5 block w-full min-h-[44px] rounded-xl border bg-[#0B1020] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 transition-colors focus:outline-none focus:ring-2 disabled:opacity-60 ${
                    errors.title
                      ? 'border-rose-500/70 focus:border-rose-400 focus:ring-rose-500/20'
                      : 'border-white/10 focus:border-[#8B5CF6] focus:ring-[#8B5CF6]/25'
                  }`}
                />

                {errors.title && (
                  <p
                    id="modal-task-title-error"
                    role="alert"
                    className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-rose-400"
                  >
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span>{errors.title}</span>
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between gap-2">
                  <label
                    htmlFor="modal-task-description"
                    className="block text-sm font-medium text-slate-200"
                  >
                    Description{' '}
                    <span className="font-normal text-slate-500">
                      (optional)
                    </span>
                  </label>
                  <span
                    className={`text-xs tabular-nums ${
                      descriptionLength > DESCRIPTION_MAX_LENGTH
                        ? 'font-medium text-rose-400'
                        : 'text-slate-500'
                    }`}
                  >
                    {descriptionLength}/{DESCRIPTION_MAX_LENGTH}
                  </span>
                </div>

                <textarea
                  id="modal-task-description"
                  rows={3}
                  value={description}
                  onChange={(e) => handleDescriptionChange(e.target.value)}
                  disabled={isSubmitting}
                  placeholder="Add context, links, or next steps..."
                  aria-invalid={Boolean(errors.description)}
                  aria-describedby={
                    errors.description
                      ? 'modal-task-description-error'
                      : undefined
                  }
                  className={`mt-1.5 block w-full resize-y rounded-xl border bg-[#0B1020] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 transition-colors focus:outline-none focus:ring-2 disabled:opacity-60 ${
                    errors.description
                      ? 'border-rose-500/70 focus:border-rose-400 focus:ring-rose-500/20'
                      : 'border-white/10 focus:border-[#8B5CF6] focus:ring-[#8B5CF6]/25'
                  }`}
                />

                {errors.description && (
                  <p
                    id="modal-task-description-error"
                    role="alert"
                    className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-rose-400"
                  >
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span>{errors.description}</span>
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="modal-task-category"
                    className="block text-sm font-medium text-slate-200"
                  >
                    Category
                  </label>
                  <select
                    id="modal-task-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as TaskCategory)}
                    disabled={isSubmitting}
                    className="mt-1.5 block w-full min-h-[44px] rounded-xl border border-white/10 bg-[#0B1020] px-3 py-2.5 text-sm text-white transition-colors focus:border-[#8B5CF6] focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/25"
                  >
                    {TASK_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="modal-task-priority"
                    className="block text-sm font-medium text-slate-200"
                  >
                    Priority
                  </label>
                  <select
                    id="modal-task-priority"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TaskPriority)}
                    disabled={isSubmitting}
                    className="mt-1.5 block w-full min-h-[44px] rounded-xl border border-white/10 bg-[#0B1020] px-3 py-2.5 text-sm text-white transition-colors focus:border-[#8B5CF6] focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/25"
                  >
                    {TASK_PRIORITIES.map((prio) => (
                      <option key={prio} value={prio}>
                        {prio}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="modal-task-due-date"
                    className="block text-sm font-medium text-slate-200"
                  >
                    Due Date
                  </label>
                  <input
                    id="modal-task-due-date"
                    type="date"
                    value={dueDate}
                    onChange={(e) => handleDueDateChange(e.target.value)}
                    disabled={isSubmitting}
                    className="mt-1.5 block w-full min-h-[44px] rounded-xl border border-white/10 bg-[#0B1020] px-3 py-2.5 text-sm text-white transition-colors focus:border-[#8B5CF6] focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/25"
                  />
                  {errors.due_date && (
                    <p
                      role="alert"
                      className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-rose-400"
                    >
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      <span>{errors.due_date}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="modal-task-status"
                    className="block text-sm font-medium text-slate-200"
                  >
                    Status
                  </label>
                  <select
                    id="modal-task-status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as TaskStatus)}
                    disabled={isSubmitting}
                    className="mt-1.5 block w-full min-h-[44px] rounded-xl border border-white/10 bg-[#0B1020] px-3 py-2.5 text-sm text-white transition-colors focus:border-[#8B5CF6] focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/25"
                  >
                    <option value={TaskStatus.Pending}>Pending</option>
                    <option value={TaskStatus.Completed}>Completed</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-3 border-t border-white/[0.08] pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="inline-flex min-h-[42px] items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-60 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-[#8B5CF6]/20 transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6]"
                >
                  {isEditMode ? (
                    <>
                      <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span>{isSubmitting ? 'Saving...' : 'Save Changes'}</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span>{isSubmitting ? 'Creating...' : 'Create Task'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
