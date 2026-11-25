import {
  Activity,
  BarChart3,
  CheckCircle2,
  Clock,
  ListChecks,
  TrendingUp,
} from 'lucide-react';
import { motion } from 'motion/react';
import {
  TASK_CATEGORIES,
  TASK_PRIORITIES,
  Task,
  TaskCategory,
  TaskPriority,
  TaskStatus,
} from '../types/task';
import {
  buildWeeklyProductivityData,
  getTodayDateISO,
  isTaskOverdue,
  isTaskUpcoming,
} from '../utils/storage';
import { EmptyState } from './EmptyState';
import { WeeklyProductivityChart } from './WeeklyProductivityChart';

interface AnalyticsViewProps {
  tasks: Task[];
  counts: {
    all: number;
    pending: number;
    completed: number;
  };
  onQuickAdd: () => void;
}

const CATEGORY_BAR_COLOR: Record<TaskCategory, string> = {
  [TaskCategory.Personal]: 'bg-[#8B5CF6]',
  [TaskCategory.College]: 'bg-[#3B82F6]',
  [TaskCategory.Work]: 'bg-[#10B981]',
};

const PRIORITY_BAR_COLOR: Record<TaskPriority, string> = {
  [TaskPriority.High]: 'bg-rose-500',
  [TaskPriority.Medium]: 'bg-amber-500',
  [TaskPriority.Low]: 'bg-[#3B82F6]',
};

export function AnalyticsView({
  tasks,
  counts,
  onQuickAdd,
}: AnalyticsViewProps) {
  const todayISO = getTodayDateISO();
  const completionPct =
    counts.all > 0 ? Math.round((counts.completed / counts.all) * 100) : 0;

  const weeklyData = buildWeeklyProductivityData(tasks);
  const overdueCount = tasks.filter((t) => isTaskOverdue(t, todayISO)).length;
  const upcomingCount = tasks.filter((t) => isTaskUpcoming(t, todayISO)).length;

  const categoryBreakdown = TASK_CATEGORIES.map((category) => {
    const items = tasks.filter((t) => t.category === category);
    const completed = items.filter(
      (t) => t.status === TaskStatus.Completed
    ).length;
    const pending = items.length - completed;
    const sharePct =
      counts.all > 0 ? Math.round((items.length / counts.all) * 100) : 0;

    return {
      category,
      total: items.length,
      completed,
      pending,
      sharePct,
    };
  });

  const priorityBreakdown = TASK_PRIORITIES.map((priority) => {
    const items = tasks.filter((t) => t.priority === priority);
    const completed = items.filter(
      (t) => t.status === TaskStatus.Completed
    ).length;
    const sharePct =
      counts.all > 0 ? Math.round((items.length / counts.all) * 100) : 0;

    return {
      priority,
      total: items.length,
      completed,
      pending: items.length - completed,
      sharePct,
    };
  });

  // Completion ring geometry
  const ringRadius = 54;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset =
    ringCircumference - (completionPct / 100) * ringCircumference;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Analytics
        </h1>
        <p className="mt-1.5 text-sm sm:text-base text-slate-400">
          Real-time completion rates, weekly activity, and category breakdowns
          from your saved tasks.
        </p>
      </div>

      {/* Summary KPIs */}
      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-white/[0.08] bg-[#171F35]/90 p-5 shadow-lg shadow-black/20">
          <div className="flex items-center justify-between">
            <dt className="text-sm font-medium text-slate-400">Total Tasks</dt>
            <ListChecks className="h-4 w-4 text-[#3B82F6]" aria-hidden="true" />
          </div>
          <dd className="mt-3 font-display text-3xl font-bold text-white tabular-nums">
            {counts.all}
          </dd>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-[#171F35]/90 p-5 shadow-lg shadow-black/20">
          <div className="flex items-center justify-between">
            <dt className="text-sm font-medium text-slate-400">Completed</dt>
            <CheckCircle2
              className="h-4 w-4 text-[#10B981]"
              aria-hidden="true"
            />
          </div>
          <dd className="mt-3 font-display text-3xl font-bold text-[#10B981] tabular-nums">
            {counts.completed}
          </dd>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-[#171F35]/90 p-5 shadow-lg shadow-black/20">
          <div className="flex items-center justify-between">
            <dt className="text-sm font-medium text-slate-400">Pending</dt>
            <Clock className="h-4 w-4 text-[#8B5CF6]" aria-hidden="true" />
          </div>
          <dd className="mt-3 font-display text-3xl font-bold text-white tabular-nums">
            {counts.pending}
          </dd>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-[#171F35]/90 p-5 shadow-lg shadow-black/20">
          <div className="flex items-center justify-between">
            <dt className="text-sm font-medium text-slate-400">
              Completion Rate
            </dt>
            <TrendingUp
              className="h-4 w-4 text-[#10B981]"
              aria-hidden="true"
            />
          </div>
          <dd className="mt-3 font-display text-3xl font-bold text-white tabular-nums">
            {completionPct}%
          </dd>
        </div>
      </dl>

      {counts.all === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="No task data to analyze yet"
          description="Create and complete tasks to unlock real-time weekly productivity charts, category distributions, and completion trends."
          primaryActionLabel="Create First Task"
          onPrimaryAction={onQuickAdd}
        />
      ) : (
        <>
          {/* Weekly Chart + Completed vs Pending Ring */}
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
            <div className="xl:col-span-8">
              <WeeklyProductivityChart
                data={weeklyData}
                title="Weekly Productivity Trend"
                subtitle="Daily scheduled and completed tasks over the past 7 days."
              />
            </div>

            <section className="xl:col-span-4 rounded-2xl border border-white/[0.08] bg-[#171F35]/90 p-6 shadow-lg shadow-black/20 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Activity
                    className="h-5 w-5 text-[#10B981]"
                    aria-hidden="true"
                  />
                  <h2 className="font-display text-base sm:text-lg font-semibold text-white">
                    Completed vs. Pending
                  </h2>
                </div>
                <p className="mt-1 text-xs sm:text-sm text-slate-400">
                  Overall completion ratio across all saved tasks.
                </p>
              </div>

              <div className="my-6 flex items-center justify-center">
                <div className="relative flex h-36 w-36 items-center justify-center">
                  <svg
                    className="-rotate-90 h-36 w-36"
                    viewBox="0 0 128 128"
                    aria-hidden="true"
                  >
                    <circle
                      cx="64"
                      cy="64"
                      r={ringRadius}
                      fill="none"
                      stroke="rgba(255,255,255,0.06)"
                      strokeWidth="12"
                    />
                    <motion.circle
                      cx="64"
                      cy="64"
                      r={ringRadius}
                      fill="none"
                      stroke="url(#taskflowCompletionGrad)"
                      strokeWidth="12"
                      strokeLinecap="round"
                      strokeDasharray={ringCircumference}
                      initial={{ strokeDashoffset: ringCircumference }}
                      animate={{ strokeDashoffset: ringOffset }}
                      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    />
                    <defs>
                      <linearGradient
                        id="taskflowCompletionGrad"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="0%"
                      >
                        <stop offset="0%" stopColor="#8B5CF6" />
                        <stop offset="100%" stopColor="#10B981" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="font-display text-2xl font-bold text-white tabular-nums">
                      {completionPct}%
                    </span>
                    <span className="text-[11px] text-slate-400">Done</span>
                  </div>
                </div>
              </div>

              <dl className="grid grid-cols-2 gap-3 border-t border-white/[0.08] pt-4 text-xs">
                <div>
                  <dt className="text-slate-400">Upcoming</dt>
                  <dd className="mt-0.5 font-display text-base font-semibold text-white tabular-nums">
                    {upcomingCount}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-400">Overdue</dt>
                  <dd
                    className={`mt-0.5 font-display text-base font-semibold tabular-nums ${
                      overdueCount > 0 ? 'text-rose-400' : 'text-white'
                    }`}
                  >
                    {overdueCount}
                  </dd>
                </div>
              </dl>
            </section>
          </div>

          {/* Category Distribution & Priority Breakdown */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <section className="rounded-2xl border border-white/[0.08] bg-[#171F35]/90 p-6 shadow-lg shadow-black/20">
              <div className="flex items-center gap-2.5">
                <BarChart3
                  className="h-5 w-5 text-[#8B5CF6]"
                  aria-hidden="true"
                />
                <h2 className="font-display text-lg font-semibold text-white">
                  Category Distribution
                </h2>
              </div>
              <p className="mt-1 text-sm text-slate-400">
                Breakdown across Personal, College, and Work categories.
              </p>

              <div className="mt-6 space-y-5">
                {categoryBreakdown.map((item) => (
                  <div key={item.category} className="space-y-2">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="font-medium text-white">
                        {item.category}
                      </span>
                      <span className="text-xs text-slate-400 tabular-nums">
                        {item.total} {item.total === 1 ? 'task' : 'tasks'} ·{' '}
                        {item.completed} done · {item.pending} pending (
                        {item.sharePct}%)
                      </span>
                    </div>

                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#0B1020]">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${item.sharePct}%` }}
                        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                        className={`h-full rounded-full ${CATEGORY_BAR_COLOR[item.category]}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-white/[0.08] bg-[#171F35]/90 p-6 shadow-lg shadow-black/20">
              <h2 className="font-display text-lg font-semibold text-white">
                Priority Breakdown
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Distribution across High, Medium, and Low priority levels.
              </p>

              <div className="mt-6 space-y-5">
                {priorityBreakdown.map((item) => (
                  <div key={item.priority} className="space-y-2">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="font-medium text-white">
                        {item.priority} Priority
                      </span>
                      <span className="text-xs text-slate-400 tabular-nums">
                        {item.total} {item.total === 1 ? 'task' : 'tasks'} ·{' '}
                        {item.completed} done · {item.pending} pending (
                        {item.sharePct}%)
                      </span>
                    </div>

                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#0B1020]">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${item.sharePct}%` }}
                        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                        className={`h-full rounded-full ${PRIORITY_BAR_COLOR[item.priority]}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
