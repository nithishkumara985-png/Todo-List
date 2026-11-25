import { Session } from '@supabase/supabase-js';
import {
  AlertCircle,
  Check,
  Copy,
  Database,
  Plus,
  RefreshCw,
  X,
} from 'lucide-react';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnalyticsView } from './components/AnalyticsView';
import { AuthPanel } from './components/AuthPanel';
import { DashboardView } from './components/DashboardView';
import { Sidebar } from './components/Sidebar';
import { TaskList } from './components/TaskList';
import { TaskModal } from './components/TaskModal';
import { TaskToolbar } from './components/TaskToolbar';
import { ToastContainer } from './components/ToastContainer';
import {
  BASE_TASK_COLUMNS,
  EXTENDED_TASK_COLUMNS,
  TASKS_MIGRATION_SQL,
  formatSupabaseError,
  isMissingColumnError,
  isSupabaseConfigured,
  normalizeTaskRow,
  supabase,
  supabaseConfigError,
} from './lib/supabase';
import {
  FilterOption,
  NavSection,
  Task,
  TaskCategory,
  TaskFormValues,
  TaskPriority,
  TaskSortOption,
  TaskStatus,
  ToastItem,
} from './types/task';
import {
  getTodayDateISO,
  isTaskForToday,
  isTaskUpcoming,
  sortTasks,
} from './utils/storage';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(
    isSupabaseConfigured
  );
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isTasksLoading, setIsTasksLoading] = useState<boolean>(false);
  const [schemaNeedsMigration, setSchemaNeedsMigration] =
    useState<boolean>(false);
  const [showMigrationBanner, setShowMigrationBanner] =
    useState<boolean>(false);
  const [copiedSql, setCopiedSql] = useState<boolean>(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const [activeSection, setActiveSection] = useState<NavSection>(
    NavSection.Dashboard
  );
  const [selectedCategory, setSelectedCategory] = useState<TaskCategory | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterOption>(
    FilterOption.All
  );
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>(
    'all'
  );
  const [categoryFilter, setCategoryFilter] = useState<TaskCategory | 'all'>(
    'all'
  );
  const [sortBy, setSortBy] = useState<TaskSortOption>(TaskSortOption.Newest);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const pushToast = useCallback(
    (type: ToastItem['type'], title: string, message?: string) => {
      const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev.slice(-3), { id, type, title, message }]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((item) => item.id !== id));
      }, 3600);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  useEffect(() => {
    if (!supabase) {
      setIsAuthLoading(false);
      return;
    }

    let isMounted = true;

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!isMounted) {
          return;
        }
        if (error) {
          setDbError(`Authentication session error: ${error.message}`);
        }
        setSession(data.session ?? null);
        setIsAuthLoading(false);
      })
      .catch((err: unknown) => {
        if (!isMounted) {
          return;
        }
        setDbError(
          err instanceof Error
            ? `Authentication session check failed: ${err.message}`
            : 'Authentication session check failed.'
        );
        setIsAuthLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (!nextSession) {
        setTasks([]);
        setSchemaNeedsMigration(false);
        setShowMigrationBanner(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const fetchTasks = useCallback(async (userId: string) => {
    if (!supabase) {
      return;
    }

    setIsTasksLoading(true);
    setDbError(null);

    try {
      const extendedRes = await supabase
        .from('tasks')
        .select(EXTENDED_TASK_COLUMNS)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!extendedRes.error) {
        setSchemaNeedsMigration(false);
        setShowMigrationBanner(false);
        const normalized = (
          (extendedRes.data as Record<string, unknown>[]) ?? []
        ).map(normalizeTaskRow);
        setTasks(normalized);
        return;
      }

      if (isMissingColumnError(extendedRes.error)) {
        setSchemaNeedsMigration(true);
        setShowMigrationBanner(true);

        const baseRes = await supabase
          .from('tasks')
          .select(BASE_TASK_COLUMNS)
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (baseRes.error) {
          setDbError(
            formatSupabaseError(baseRes.error, 'loading tasks from Supabase')
          );
          return;
        }

        const normalized = (
          (baseRes.data as Record<string, unknown>[]) ?? []
        ).map(normalizeTaskRow);
        setTasks(normalized);
        return;
      }

      setDbError(
        formatSupabaseError(extendedRes.error, 'loading tasks from Supabase')
      );
    } catch (err) {
      setDbError(formatSupabaseError(err, 'loading tasks from Supabase'));
    } finally {
      setIsTasksLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!session?.user?.id) {
      setTasks([]);
      return;
    }
    void fetchTasks(session.user.id);
  }, [session?.user?.id, fetchTasks]);

  const todayISO = getTodayDateISO();

  const counts = useMemo(() => {
    let pending = 0;
    let completed = 0;
    let today = 0;
    let upcoming = 0;
    const categoryCounts: Record<TaskCategory, number> = {
      [TaskCategory.Personal]: 0,
      [TaskCategory.College]: 0,
      [TaskCategory.Work]: 0,
    };

    for (const task of tasks) {
      if (task.status === TaskStatus.Completed) {
        completed += 1;
      } else {
        pending += 1;
      }
      if (isTaskForToday(task, todayISO)) {
        today += 1;
      }
      if (isTaskUpcoming(task, todayISO)) {
        upcoming += 1;
      }
      categoryCounts[task.category] = (categoryCounts[task.category] ?? 0) + 1;
    }

    return {
      all: tasks.length,
      pending,
      completed,
      today,
      upcoming,
      categoryCounts,
    };
  }, [tasks, todayISO]);

  const todayTasks = useMemo(
    () => tasks.filter((task) => isTaskForToday(task, todayISO)),
    [tasks, todayISO]
  );

  const upcomingTasks = useMemo(
    () =>
      sortTasks(
        tasks.filter((task) => isTaskUpcoming(task, todayISO)),
        TaskSortOption.DueDate
      ),
    [tasks, todayISO]
  );

  const viewScopedTasks = useMemo(() => {
    if (activeSection === NavSection.Today) {
      return todayTasks;
    }
    if (activeSection === NavSection.Upcoming) {
      return upcomingTasks;
    }
    if (activeSection === NavSection.Completed) {
      return tasks.filter((t) => t.status === TaskStatus.Completed);
    }
    if (activeSection === NavSection.MyTasks && selectedCategory) {
      return tasks.filter((t) => t.category === selectedCategory);
    }
    return tasks;
  }, [
    activeSection,
    selectedCategory,
    tasks,
    todayTasks,
    upcomingTasks,
  ]);

  const toolbarCounts = useMemo(() => {
    let pending = 0;
    let completed = 0;
    for (const task of viewScopedTasks) {
      if (task.status === TaskStatus.Completed) {
        completed += 1;
      } else {
        pending += 1;
      }
    }
    return {
      all: viewScopedTasks.length,
      pending,
      completed,
    };
  }, [viewScopedTasks]);

  const filteredTasks = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const filtered = viewScopedTasks.filter((task) => {
      if (
        activeSection !== NavSection.Completed &&
        activeSection !== NavSection.Upcoming
      ) {
        const matchesStatus =
          activeFilter === FilterOption.All ||
          (activeFilter === FilterOption.Pending &&
            task.status === TaskStatus.Pending) ||
          (activeFilter === FilterOption.Completed &&
            task.status === TaskStatus.Completed);

        if (!matchesStatus) {
          return false;
        }
      }

      if (priorityFilter !== 'all' && task.priority !== priorityFilter) {
        return false;
      }

      if (
        !selectedCategory &&
        categoryFilter !== 'all' &&
        task.category !== categoryFilter
      ) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return (
        task.title.toLowerCase().includes(normalizedQuery) ||
        task.description.toLowerCase().includes(normalizedQuery)
      );
    });

    return sortTasks(filtered, sortBy);
  }, [
    viewScopedTasks,
    activeSection,
    activeFilter,
    priorityFilter,
    categoryFilter,
    selectedCategory,
    searchQuery,
    sortBy,
  ]);

  const getActiveUserId = async (): Promise<string | null> => {
    if (!supabase) {
      setDbError(supabaseConfigError ?? 'Supabase client is not initialized.');
      return null;
    }

    const { data, error } = await supabase.auth.getSession();
    if (error) {
      setDbError(`Could not verify user session: ${error.message}`);
      return null;
    }

    const activeUserId = data.session?.user?.id ?? null;
    if (!activeUserId) {
      setDbError('No active user session. Please sign in to save tasks.');
      setSession(null);
      return null;
    }

    return activeUserId;
  };

  const handleCreateTask = async (values: TaskFormValues): Promise<boolean> => {
    setDbError(null);
    const userId = await getActiveUserId();
    if (!userId || !supabase) {
      return false;
    }

    try {
      const insertExtendedPayload = {
        title: values.title,
        description: values.description,
        status: values.status,
        category: values.category,
        priority: values.priority,
        due_date: values.due_date || null,
        user_id: userId,
      };

      if (!schemaNeedsMigration) {
        const res = await supabase
          .from('tasks')
          .insert(insertExtendedPayload)
          .select(EXTENDED_TASK_COLUMNS)
          .single();

        if (!res.error && res.data) {
          setTasks((prev) => [normalizeTaskRow(res.data), ...prev]);
          pushToast('success', 'Task created', `"${values.title}" was saved.`);
          return true;
        }

        if (res.error && !isMissingColumnError(res.error)) {
          const msg = formatSupabaseError(
            res.error,
            'inserting task into Supabase'
          );
          setDbError(msg);
          pushToast('error', 'Failed to create task', msg);
          return false;
        }

        setSchemaNeedsMigration(true);
        setShowMigrationBanner(true);
      }

      const fallbackRes = await supabase
        .from('tasks')
        .insert({
          title: values.title,
          description: values.description,
          status: values.status,
          user_id: userId,
        })
        .select(BASE_TASK_COLUMNS)
        .single();

      if (fallbackRes.error) {
        const msg = formatSupabaseError(
          fallbackRes.error,
          'inserting task into Supabase'
        );
        setDbError(msg);
        pushToast('error', 'Failed to create task', msg);
        return false;
      }

      if (!fallbackRes.data) {
        const msg =
          'Task insert returned no row. Verify your Supabase SELECT and INSERT RLS policies allow auth.uid() = user_id.';
        setDbError(msg);
        pushToast('error', 'Insert returned no data', msg);
        return false;
      }

      setTasks((prev) => [normalizeTaskRow(fallbackRes.data), ...prev]);
      pushToast(
        'info',
        'Task saved',
        'Run the SQL migration to persist category, priority, and due date.'
      );
      return true;
    } catch (err) {
      const msg = formatSupabaseError(err, 'inserting task into Supabase');
      setDbError(msg);
      pushToast('error', 'Failed to create task', msg);
      return false;
    }
  };

  const handleUpdateTask = async (
    id: string,
    values: TaskFormValues
  ): Promise<boolean> => {
    setDbError(null);
    const userId = await getActiveUserId();
    if (!userId || !supabase) {
      return false;
    }

    try {
      if (!schemaNeedsMigration) {
        const res = await supabase
          .from('tasks')
          .update({
            title: values.title,
            description: values.description,
            status: values.status,
            category: values.category,
            priority: values.priority,
            due_date: values.due_date || null,
          })
          .eq('id', id)
          .eq('user_id', userId)
          .select(EXTENDED_TASK_COLUMNS)
          .single();

        if (!res.error && res.data) {
          const updated = normalizeTaskRow(res.data);
          setTasks((prev) =>
            prev.map((task) => (task.id === id ? updated : task))
          );
          pushToast('success', 'Task updated', `"${values.title}" was saved.`);
          return true;
        }

        if (res.error && !isMissingColumnError(res.error)) {
          const msg = formatSupabaseError(res.error, 'updating task');
          setDbError(msg);
          pushToast('error', 'Failed to update task', msg);
          return false;
        }

        setSchemaNeedsMigration(true);
        setShowMigrationBanner(true);
      }

      const fallbackRes = await supabase
        .from('tasks')
        .update({
          title: values.title,
          description: values.description,
          status: values.status,
        })
        .eq('id', id)
        .eq('user_id', userId)
        .select(BASE_TASK_COLUMNS)
        .single();

      if (fallbackRes.error) {
        const msg = formatSupabaseError(fallbackRes.error, 'updating task');
        setDbError(msg);
        pushToast('error', 'Failed to update task', msg);
        return false;
      }

      if (fallbackRes.data) {
        const updated = normalizeTaskRow(fallbackRes.data);
        setTasks((prev) =>
          prev.map((task) => (task.id === id ? updated : task))
        );
      }
      pushToast('success', 'Task updated', `"${values.title}" was saved.`);
      return true;
    } catch (err) {
      const msg = formatSupabaseError(err, 'updating task');
      setDbError(msg);
      pushToast('error', 'Failed to update task', msg);
      return false;
    }
  };

  const handleSaveTaskModal = async (
    values: TaskFormValues,
    taskId?: string
  ): Promise<boolean> => {
    if (taskId) {
      return handleUpdateTask(taskId, values);
    }
    return handleCreateTask(values);
  };

  const handleToggleStatus = async (id: string): Promise<void> => {
    setDbError(null);
    const userId = await getActiveUserId();
    if (!userId || !supabase) {
      return;
    }

    const target = tasks.find((t) => t.id === id);
    if (!target) {
      return;
    }

    const nextStatus =
      target.status === TaskStatus.Completed
        ? TaskStatus.Pending
        : TaskStatus.Completed;

    try {
      const res = schemaNeedsMigration
        ? await supabase
            .from('tasks')
            .update({ status: nextStatus })
            .eq('id', id)
            .eq('user_id', userId)
            .select(BASE_TASK_COLUMNS)
            .single()
        : await supabase
            .from('tasks')
            .update({ status: nextStatus })
            .eq('id', id)
            .eq('user_id', userId)
            .select(EXTENDED_TASK_COLUMNS)
            .single();

      if (res.error) {
        const msg = formatSupabaseError(res.error, 'updating task status');
        setDbError(msg);
        pushToast('error', 'Status update failed', msg);
        return;
      }

      if (res.data) {
        const updated = normalizeTaskRow(res.data);
        setTasks((prev) =>
          prev.map((task) => (task.id === id ? updated : task))
        );
        pushToast(
          'success',
          nextStatus === TaskStatus.Completed
            ? 'Task completed'
            : 'Task reopened',
          `"${target.title}" marked as ${nextStatus}.`
        );
      }
    } catch (err) {
      const msg = formatSupabaseError(err, 'updating task status');
      setDbError(msg);
      pushToast('error', 'Status update failed', msg);
    }
  };

  const handleDeleteTask = async (id: string): Promise<void> => {
    setDbError(null);
    const userId = await getActiveUserId();
    if (!userId || !supabase) {
      return;
    }

    const target = tasks.find((t) => t.id === id);

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        const msg = formatSupabaseError(error, 'deleting task');
        setDbError(msg);
        pushToast('error', 'Delete failed', msg);
        return;
      }

      setTasks((prev) => prev.filter((task) => task.id !== id));
      pushToast(
        'info',
        'Task deleted',
        target ? `"${target.title}" was removed.` : undefined
      );
    } catch (err) {
      const msg = formatSupabaseError(err, 'deleting task');
      setDbError(msg);
      pushToast('error', 'Delete failed', msg);
    }
  };

  const handleSignOut = async () => {
    if (!supabase) {
      return;
    }
    setDbError(null);
    const { error } = await supabase.auth.signOut();
    if (error) {
      const msg = `Sign out failed: ${error.message}`;
      setDbError(msg);
      pushToast('error', 'Logout failed', msg);
    }
  };

  const handleSelectSection = (section: NavSection) => {
    setActiveSection(section);
    setSelectedCategory(null);
    setSearchQuery('');
    setActiveFilter(FilterOption.All);
    setPriorityFilter('all');
    setCategoryFilter('all');
    setSortBy(
      section === NavSection.Upcoming
        ? TaskSortOption.DueDate
        : TaskSortOption.Newest
    );
  };

  const handleSelectCategory = (category: TaskCategory) => {
    setActiveSection(NavSection.MyTasks);
    setSelectedCategory(category);
    setSearchQuery('');
    setActiveFilter(FilterOption.All);
    setPriorityFilter('all');
    setCategoryFilter('all');
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setActiveFilter(FilterOption.All);
    setPriorityFilter('all');
    setCategoryFilter('all');
    setSelectedCategory(null);
    setSortBy(TaskSortOption.Newest);
  };

  const openCreateModal = () => {
    setEditingTask(null);
    setIsTaskModalOpen(true);
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  const handleCopySql = async () => {
    try {
      await navigator.clipboard.writeText(TASKS_MIGRATION_SQL);
      setCopiedSql(true);
      pushToast('success', 'SQL copied', 'Paste into Supabase SQL Editor.');
      window.setTimeout(() => setCopiedSql(false), 2000);
    } catch {
      // Ignore clipboard failure in restricted contexts
    }
  };

  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen bg-[#0B1020] px-4 py-12 text-slate-100 flex items-center justify-center">
        <div
          role="alert"
          className="w-full max-w-2xl rounded-2xl border border-rose-500/30 bg-[#171F35] p-6 sm:p-8 shadow-2xl"
        >
          <div className="flex items-start gap-3">
            <AlertCircle
              className="mt-0.5 h-5 w-5 shrink-0 text-rose-400"
              aria-hidden="true"
            />
            <div>
              <h1 className="font-display text-lg font-bold text-white">
                Supabase environment variables are not configured
              </h1>
              <p className="mt-1.5 text-sm text-rose-300">
                {supabaseConfigError}
              </p>
              <p className="mt-2 text-sm text-slate-300">
                Configure{' '}
                <code className="font-mono text-white">VITE_SUPABASE_URL</code>{' '}
                and{' '}
                <code className="font-mono text-white">
                  VITE_SUPABASE_ANON_KEY
                </code>{' '}
                in your environment variables or AI Studio Secrets, then reload
                TaskFlow.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#0B1020] flex items-center justify-center px-4 text-sm text-slate-400">
        Checking user session...
      </div>
    );
  }

  if (!session) {
    return (
      <MotionConfig reducedMotion="user">
        <div className="relative min-h-screen overflow-hidden bg-[#0B1020] px-4 py-12 flex items-center justify-center">
          <div
            className="pointer-events-none absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-[#8B5CF6]/15 blur-3xl"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -bottom-40 right-1/4 h-96 w-96 rounded-full bg-[#3B82F6]/15 blur-3xl"
            aria-hidden="true"
          />
          <div className="relative z-10 w-full max-w-md">
            <AuthPanel />
          </div>
        </div>
      </MotionConfig>
    );
  }

  const userEmail = session.user.email ?? 'Signed-in user';

  const sectionTitleMap: Record<NavSection, string> = {
    [NavSection.Dashboard]: 'Dashboard',
    [NavSection.MyTasks]: selectedCategory
      ? `${selectedCategory} Tasks`
      : 'My Tasks',
    [NavSection.Today]: 'Today',
    [NavSection.Upcoming]: 'Upcoming',
    [NavSection.Completed]: 'Completed Tasks',
    [NavSection.Analytics]: 'Analytics',
  };

  const sectionSubtitleMap: Record<NavSection, string> = {
    [NavSection.Dashboard]: '',
    [NavSection.MyTasks]: selectedCategory
      ? `Manage and track tasks under the ${selectedCategory} category.`
      : 'Search, filter, sort, and organize every task in your workspace.',
    [NavSection.Today]: 'Tasks scheduled for today or created today.',
    [NavSection.Upcoming]: 'Pending tasks with upcoming future due dates.',
    [NavSection.Completed]: 'Review every task you have completed.',
    [NavSection.Analytics]: '',
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="relative min-h-screen bg-[#0B1020] text-slate-100 overflow-x-clip">
        {/* Subtle Ambient Midnight Glows */}
        <div
          className="pointer-events-none fixed inset-0 overflow-hidden"
          aria-hidden="true"
        >
          <motion.div
            animate={{ opacity: [0.35, 0.5, 0.35] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -top-48 left-1/4 h-[28rem] w-[28rem] rounded-full bg-[#8B5CF6]/[0.09] blur-3xl"
          />
          <motion.div
            animate={{ opacity: [0.3, 0.45, 0.3] }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 2,
            }}
            className="absolute bottom-[-10rem] right-[10%] h-[26rem] w-[26rem] rounded-full bg-[#3B82F6]/[0.08] blur-3xl"
          />
        </div>

        <Sidebar
          activeSection={activeSection}
          selectedCategory={selectedCategory}
          onSelectSection={handleSelectSection}
          onSelectCategory={handleSelectCategory}
          categoryCounts={counts.categoryCounts}
          sectionCounts={{
            all: counts.all,
            today: counts.today,
            upcoming: counts.upcoming,
            completed: counts.completed,
          }}
          userEmail={userEmail}
          onLogout={handleSignOut}
          onQuickAdd={openCreateModal}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
          isMobileOpen={isMobileSidebarOpen}
          onOpenMobile={() => setIsMobileSidebarOpen(true)}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        <main
          className={`relative z-10 transition-[padding] duration-200 ease-out ${
            isSidebarCollapsed ? 'lg:pl-[76px]' : 'lg:pl-64'
          }`}
        >
          <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8 space-y-6">
            {showMigrationBanner && schemaNeedsMigration && (
              <section
                aria-label="Database migration required for extended columns"
                className="rounded-2xl border border-amber-500/30 bg-[#171F35]/90 p-5 shadow-lg backdrop-blur-sm"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-3">
                    <Database
                      className="mt-0.5 h-5 w-5 shrink-0 text-amber-400"
                      aria-hidden="true"
                    />
                    <div>
                      <h2 className="font-display text-sm font-semibold text-white">
                        SQL Migration Needed for Category, Priority &amp; Due Date
                      </h2>
                      <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                        Core CRUD works with your existing{' '}
                        <code className="font-mono">tasks</code> table (
                        <code className="font-mono">
                          id, title, description, status, created_at, user_id
                        </code>
                        ). Run this SQL in Supabase SQL Editor to persist{' '}
                        <code className="font-mono">category</code>,{' '}
                        <code className="font-mono">priority</code>, and{' '}
                        <code className="font-mono">due_date</code>:
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowMigrationBanner(false)}
                    aria-label="Dismiss migration notice"
                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white self-end sm:self-start"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>

                <pre className="mt-3 overflow-x-auto rounded-xl border border-white/10 bg-[#0B1020] p-3.5 font-mono text-xs text-slate-200">
                  {TASKS_MIGRATION_SQL}
                </pre>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      void handleCopySql();
                    }}
                    className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/10"
                  >
                    {copiedSql ? (
                      <>
                        <Check
                          className="h-3.5 w-3.5 text-[#10B981]"
                          aria-hidden="true"
                        />
                        <span>Copied SQL</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Copy SQL</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (session.user.id) {
                        void fetchTasks(session.user.id);
                      }
                    }}
                    className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl bg-[#3B82F6] px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-600"
                  >
                    <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Re-check Schema</span>
                  </button>
                </div>
              </section>
            )}

            {dbError && (
              <div
                role="alert"
                className="flex items-start justify-between gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3.5 text-sm text-rose-200"
              >
                <div className="flex items-start gap-2.5">
                  <AlertCircle
                    className="mt-0.5 h-4 w-4 shrink-0 text-rose-400"
                    aria-hidden="true"
                  />
                  <span>{dbError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setDbError(null)}
                  aria-label="Dismiss error message"
                  className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-rose-300 hover:bg-rose-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            )}

            <AnimatePresence mode="wait">
              <motion.div
                key={`${activeSection}-${selectedCategory ?? 'all'}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              >
                {activeSection === NavSection.Dashboard && (
                  <DashboardView
                    userEmail={userEmail}
                    tasks={tasks}
                    todayTasks={todayTasks}
                    isLoading={isTasksLoading}
                    counts={counts}
                    onQuickAdd={openCreateModal}
                    onNavigate={handleSelectSection}
                    onToggleStatus={handleToggleStatus}
                    onEditTask={openEditModal}
                    onDeleteTask={handleDeleteTask}
                  />
                )}

                {activeSection === NavSection.Analytics && (
                  <AnalyticsView
                    tasks={tasks}
                    counts={counts}
                    onQuickAdd={openCreateModal}
                  />
                )}

                {(activeSection === NavSection.MyTasks ||
                  activeSection === NavSection.Today ||
                  activeSection === NavSection.Upcoming ||
                  activeSection === NavSection.Completed) && (
                  <div className="space-y-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white">
                          {sectionTitleMap[activeSection]}
                        </h1>
                        <p className="mt-1.5 text-sm sm:text-base text-slate-400">
                          {sectionSubtitleMap[activeSection]}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={openCreateModal}
                        className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#8B5CF6]/20 transition-all duration-150 hover:opacity-95 hover:-translate-y-0.5 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6]"
                      >
                        <Plus className="h-4 w-4 shrink-0" aria-hidden="true" />
                        <span>New Task</span>
                      </button>
                    </div>

                    <TaskToolbar
                      searchQuery={searchQuery}
                      onSearchChange={setSearchQuery}
                      activeFilter={activeFilter}
                      onFilterChange={setActiveFilter}
                      priorityFilter={priorityFilter}
                      onPriorityFilterChange={setPriorityFilter}
                      categoryFilter={categoryFilter}
                      onCategoryFilterChange={setCategoryFilter}
                      sortBy={sortBy}
                      onSortChange={setSortBy}
                      counts={toolbarCounts}
                      hideStatusTabs={
                        activeSection === NavSection.Completed ||
                        activeSection === NavSection.Upcoming
                      }
                      hideCategorySelect={selectedCategory !== null}
                    />

                    <TaskList
                      tasks={filteredTasks}
                      totalTaskCount={viewScopedTasks.length}
                      isLoading={isTasksLoading}
                      activeFilter={activeFilter}
                      searchQuery={searchQuery}
                      emptyHeading={
                        selectedCategory
                          ? `No tasks in ${selectedCategory}`
                          : activeSection === NavSection.Today
                            ? 'Nothing scheduled for today'
                            : activeSection === NavSection.Upcoming
                              ? 'No upcoming tasks scheduled'
                              : activeSection === NavSection.Completed
                                ? 'No completed tasks yet'
                                : undefined
                      }
                      emptyDescription={
                        selectedCategory
                          ? `Create a task under the ${selectedCategory} category to organize it here.`
                          : activeSection === NavSection.Today
                            ? 'Tasks with today’s due date or created today will appear here.'
                            : activeSection === NavSection.Upcoming
                              ? 'Pending tasks with a future due date will appear here automatically.'
                              : activeSection === NavSection.Completed
                                ? 'Complete any pending task and it will appear in your archive.'
                                : undefined
                      }
                      onToggleStatus={handleToggleStatus}
                      onEditTask={openEditModal}
                      onDeleteTask={handleDeleteTask}
                      onResetFilters={handleResetFilters}
                      onNewTaskClick={openCreateModal}
                    />
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

        {/* Task Creation & Editing Modal */}
        <TaskModal
          isOpen={isTaskModalOpen}
          editingTask={editingTask}
          defaultCategory={selectedCategory ?? TaskCategory.Personal}
          defaultDueDate={activeSection === NavSection.Today ? todayISO : ''}
          schemaNeedsMigration={schemaNeedsMigration}
          onClose={() => {
            setIsTaskModalOpen(false);
            setEditingTask(null);
          }}
          onSave={handleSaveTaskModal}
        />

        {/* Toast Notifications */}
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </div>
    </MotionConfig>
  );
}
