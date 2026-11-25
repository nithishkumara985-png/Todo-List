import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock,
  Flame,
  ListChecks,
  Plus,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { motion } from 'motion/react';
import {
  NavSection,
  Task,
  TaskPriority,
  TaskSortOption,
  TaskStatus,
} from '../types/task';
import {
  buildWeeklyProductivityData,
  formatTaskDate,
  formatTodayHeading,
  getDisplayNameFromEmail,
  getTimeGreeting,
  sortTasks,
} from '../utils/storage';
import { EmptyState } from './EmptyState';
import { TaskCard } from './TaskCard';
import { WeeklyProductivityChart } from './WeeklyProductivityChart';

interface DashboardViewProps {
  userEmail: string;
  tasks: Task[];
  todayTasks: Task[];
  isLoading: boolean;
  counts: {
    all: number;
    pending: number;
    completed: number;
  };
  onQuickAdd: () => void;
  onNavigate: (section: NavSection) => void;
  onToggleStatus: (id: string) => Promise<void>;
  onEditTask: (task: Task) => void;
  onDeleteTask: (id: string) => Promise<void>;
}

export function DashboardView({
  userEmail,
  tasks,
  todayTasks,
  isLoading,
  counts,
  onQuickAdd,
  onNavigate,
  onToggleStatus,
  onEditTask,
  onDeleteTask,
}: DashboardViewProps) {
  const displayName = getDisplayNameFromEmail(userEmail);
  const greeting = getTimeGreeting();
  const todayHeading = formatTodayHeading();

  const productivityPct =
    counts.all > 0 ? Math.round((counts.completed / counts.all) * 100) : 0;

  const motivationalSubtitle =
    counts.all === 0
      ? 'Start fresh today—capture your top priorities and build steady momentum.'
      : counts.pending === 0
        ? 'All current tasks are complete. Take a moment to review or plan ahead.'
        : `You have ${counts.pending} pending ${counts.pending === 1 ? 'task' : 'tasks'}—focus on high-priority work first.`;

  const weeklyData = buildWeeklyProductivityData(tasks);

  // Today's priority tasks: pending tasks for today sorted by priority (High -> Medium -> Low)
  const todayPriorityTasks = sortTasks(
    todayTasks.filter((t) => t.status === TaskStatus.Pending),
    TaskSortOption.Priority
  ).slice(0, 4);

  // Recently added/updated tasks (latest 5 from DB)
  const recentTasks = sortTasks(tasks, TaskSortOption.Newest).slice(0, 5);

  const todayCompleted = todayTasks.filter(
    (t) => t.status === TaskStatus.Completed
  ).length;
  const todayTotal = todayTasks.length;
  const dailyProgressPct =
    todayTotal > 0 ? Math.round((todayCompleted / todayTotal) * 100) : 0;

  const statCards = [
    {
      label: 'Total Tasks',
      value: counts.all,
      suffix: '',
      icon: ListChecks,
      iconColor: 'text-[#3B82F6]',
      gradient: 'from-[#3B82F6]/15 via-transparent to-transparent',
    },
    {
      label: 'Pending Tasks',
      value: counts.pending,
      suffix: '',
      icon: Clock,
      iconColor: 'text-[#8B5CF6]',
      gradient: 'from-[#8B5CF6]/15 via-transparent to-transparent',
    },
    {
      label: 'Completed Tasks',
      value: counts.completed,
      suffix: '',
      icon: CheckCircle2,
      iconColor: 'text-[#10B981]',
      gradient: 'from-[#10B981]/15 via-transparent to-transparent',
      valueColor: 'text-[#10B981]',
    },
    {
      label: 'Productivity',
      value: productivityPct,
      suffix: '%',
      icon: TrendingUp,
      iconColor: 'text-[#8B5CF6]',
      gradient:
        'from-[#8B5CF6]/15 via-[#3B82F6]/10 to-transparent',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header Row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-[#8B5CF6]">{todayHeading}</p>
          <h1 className="mt-1 font-display text-2xl sm:text-3xl font-bold tracking-tight text-white">
            {greeting}, {displayName}
          </h1>
          <p className="mt-1.5 text-sm sm:text-base text-slate-400">
            {motivationalSubtitle}
          </p>
        </div>

        <button
          type="button"
          onClick={onQuickAdd}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#8B5CF6]/20 transition-all duration-150 hover:opacity-95 hover:-translate-y-0.5 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B1020]"
        >
          <Plus className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Quick Add Task</span>
        </button>
      </div>

      {/* KPI Statistic Cards */}
      <section aria-label="Task statistics">
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {statCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.22,
                  delay: index * 0.04,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#171F35]/90 p-5 shadow-lg shadow-black/20 backdrop-blur-sm"
              >
                <div
                  className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${card.gradient}`}
                  aria-hidden="true"
                />
                <div className="relative flex items-center justify-between gap-2">
                  <dt className="text-sm font-medium text-slate-400">
                    {card.label}
                  </dt>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-[#0B1020]/60">
                    <Icon
                      className={`h-4 w-4 ${card.iconColor}`}
                      aria-hidden="true"
                    />
                  </div>
                </div>
                <dd
                  className={`relative mt-3 font-display text-3xl font-bold tracking-tight tabular-nums ${
                    card.valueColor ?? 'text-white'
                  }`}
                >
                  {card.value}
                  {card.suffix}
                </dd>
              </motion.div>
            );
          })}
        </dl>
      </section>

      {/* Daily Progress Indicator */}
      <section
        aria-labelledby="daily-progress-heading"
        className="rounded-2xl border border-white/[0.08] bg-[#171F35]/90 p-5 sm:p-6 shadow-lg shadow-black/20 backdrop-blur-sm"
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2
              id="daily-progress-heading"
              className="font-display text-base font-semibold text-white"
            >
              Daily Completion Progress
            </h2>
            <p className="mt-0.5 text-sm text-slate-400 tabular-nums">
              {todayTotal === 0
                ? 'No tasks scheduled for today yet.'
                : `${todayCompleted} of ${todayTotal} today's tasks completed (${dailyProgressPct}%)`}
            </p>
          </div>
          <span className="font-display text-lg font-bold text-[#10B981] tabular-nums">
            {todayTotal > 0
              ? `${dailyProgressPct}%`
              : `${productivityPct}% overall`}
          </span>
        </div>

        <div
          className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-[#0B1020]"
          role="progressbar"
          aria-valuenow={todayTotal > 0 ? dailyProgressPct : productivityPct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Daily task completion progress"
        >
          <motion.div
            initial={{ width: 0 }}
            animate={{
              width: `${todayTotal > 0 ? dailyProgressPct : productivityPct}%`,
            }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="h-full rounded-full bg-gradient-to-r from-[#8B5CF6] via-[#3B82F6] to-[#10B981]"
          />
        </div>
      </section>

      {/* Weekly Productivity Chart */}
      <WeeklyProductivityChart data={weeklyData} />

      {/* Today's Priority Tasks + Recent Activity */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12 xl:items-start">
        <section
          aria-labelledby="todays-priority-heading"
          className="xl:col-span-7 space-y-4"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <Flame
                className="h-5 w-5 text-[#8B5CF6] shrink-0"
                aria-hidden="true"
              />
              <h2
                id="todays-priority-heading"
                className="font-display text-lg font-semibold text-white"
              >
                Today&apos;s Priority Tasks
              </h2>
              <span className="text-xs font-medium text-slate-400 tabular-nums">
                ({todayPriorityTasks.length})
              </span>
            </div>

            <button
              type="button"
              onClick={() => onNavigate(NavSection.Today)}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#3B82F6] transition-colors hover:text-blue-400 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6] rounded-md"
            >
              <span>View Today</span>
              <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
            </button>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="h-32 animate-pulse rounded-2xl border border-white/[0.08] bg-[#171F35]/70"
                />
              ))}
            </div>
          ) : todayPriorityTasks.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title={
                todayTasks.length > 0
                  ? "All of today's tasks are complete"
                  : 'No priority tasks scheduled for today'
              }
              description={
                todayTasks.length > 0
                  ? 'Great progress—every task on your schedule for today is marked completed.'
                  : 'Add a task with today’s due date to highlight it in your daily priority queue.'
              }
              primaryActionLabel="Add Today's Task"
              onPrimaryAction={onQuickAdd}
            />
          ) : (
            <div className="space-y-3">
              {todayPriorityTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onToggleStatus={onToggleStatus}
                  onEditTask={onEditTask}
                  onDeleteTask={onDeleteTask}
                />
              ))}
            </div>
          )}
        </section>

        <section
          aria-labelledby="recent-tasks-heading"
          className="xl:col-span-5 space-y-4"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <Sparkles
                className="h-5 w-5 text-[#3B82F6] shrink-0"
                aria-hidden="true"
              />
              <h2
                id="recent-tasks-heading"
                className="font-display text-lg font-semibold text-white"
              >
                Recent Tasks
              </h2>
            </div>

            <button
              type="button"
              onClick={() => onNavigate(NavSection.MyTasks)}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#3B82F6] transition-colors hover:text-blue-400 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6] rounded-md"
            >
              <span>All ({tasks.length})</span>
              <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
            </button>
          </div>

          {isLoading ? (
            <div className="h-64 animate-pulse rounded-2xl border border-white/[0.08] bg-[#171F35]/70" />
          ) : recentTasks.length === 0 ? (
            <EmptyState
              icon={ListChecks}
              title="No recent activity"
              description="Tasks you create or update will appear here for quick access."
              primaryActionLabel="Create Task"
              onPrimaryAction={onQuickAdd}
            />
          ) : (
            <div className="rounded-2xl border border-white/[0.08] bg-[#171F35]/90 divide-y divide-white/[0.06] shadow-lg shadow-black/20 backdrop-blur-sm">
              {recentTasks.map((task) => {
                const isCompleted = task.status === TaskStatus.Completed;
                const prioDot =
                  task.priority === TaskPriority.High
                    ? 'text-rose-400'
                    : task.priority === TaskPriority.Medium
                      ? 'text-amber-400'
                      : 'text-[#3B82F6]';

                return (
                  <div
                    key={task.id}
                    className="flex items-center justify-between gap-3 px-4 py-3.5 transition-colors hover:bg-white/[0.03]"
                  >
                    <div className="min-w-0 flex-1">
                      <p
                        className={`truncate text-sm font-medium ${
                          isCompleted
                            ? 'text-slate-400 line-through'
                            : 'text-white'
                        }`}
                      >
                        {task.title}
                      </p>
                      <p className="mt-0.5 flex items-center gap-2 text-xs text-slate-400">
                        <span>{task.category}</span>
                        <span aria-hidden="true">·</span>
                        <span className={prioDot}>{task.priority}</span>
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums">
                          {formatTaskDate(task.created_at)}
                        </span>
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => onEditTask(task)}
                      className="shrink-0 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-white/[0.09] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6]"
                    >
                      Open
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
