import { useState } from 'react';
import { motion } from 'motion/react';
import { DailyProductivityPoint } from '../utils/storage';

interface WeeklyProductivityChartProps {
  data: DailyProductivityPoint[];
  title?: string;
  subtitle?: string;
}

export function WeeklyProductivityChart({
  data,
  title = 'Weekly Productivity',
  subtitle = 'Completed vs. scheduled tasks across the last 7 days.',
}: WeeklyProductivityChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const maxTotal = Math.max(1, ...data.map((d) => d.total));
  const totalInWeek = data.reduce((sum, d) => sum + d.total, 0);
  const completedInWeek = data.reduce((sum, d) => sum + d.completed, 0);
  const weeklyRate =
    totalInWeek > 0 ? Math.round((completedInWeek / totalInWeek) * 100) : 0;

  return (
    <section
      aria-label={title}
      className="rounded-2xl border border-white/[0.08] bg-[#171F35]/90 p-5 sm:p-6 shadow-lg shadow-black/20 backdrop-blur-sm"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-display text-base sm:text-lg font-semibold text-white">
            {title}
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">{subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs">
          <span className="inline-flex items-center gap-1.5 text-slate-300">
            <span
              className="h-2.5 w-2.5 rounded-sm bg-[#8B5CF6]"
              aria-hidden="true"
            />
            <span>Scheduled</span>
          </span>
          <span className="inline-flex items-center gap-1.5 text-slate-300">
            <span
              className="h-2.5 w-2.5 rounded-sm bg-[#10B981]"
              aria-hidden="true"
            />
            <span>Completed</span>
          </span>
          <span className="font-medium text-white tabular-nums">
            {weeklyRate}% weekly rate
          </span>
        </div>
      </div>

      <div className="mt-6">
        <div className="grid grid-cols-7 gap-2 sm:gap-4 items-end h-44 pt-6 border-b border-white/[0.06] pb-3">
          {data.map((point, index) => {
            const totalHeightPct =
              point.total > 0 ? Math.max(12, (point.total / maxTotal) * 100) : 0;
            const completedHeightPct =
              point.total > 0
                ? Math.max(
                    point.completed > 0 ? 12 : 0,
                    (point.completed / maxTotal) * 100
                  )
                : 0;
            const isHovered = hoveredIndex === index;
            const isToday = index === data.length - 1;

            return (
              <div
                key={point.dateISO}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                onFocus={() => setHoveredIndex(index)}
                onBlur={() => setHoveredIndex(null)}
                tabIndex={0}
                aria-label={`${point.label} ${point.shortDate}: ${point.completed} completed of ${point.total} tasks`}
                className="group relative flex h-full flex-col items-center justify-end focus:outline-none"
              >
                {/* Interactive Hover Tooltip */}
                {isHovered && (
                  <div className="pointer-events-none absolute -top-2 left-1/2 z-20 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-xl border border-white/15 bg-[#0B1020] px-3 py-1.5 text-xs shadow-xl">
                    <p className="font-semibold text-white">
                      {point.label}, {point.shortDate}
                    </p>
                    <p className="text-slate-300 tabular-nums">
                      {point.completed} done · {point.pending} pending
                    </p>
                  </div>
                )}

                <div className="relative flex w-full max-w-[36px] flex-1 items-end justify-center gap-1">
                  {/* Scheduled / Total Bar */}
                  <div className="relative flex h-full w-3 sm:w-3.5 items-end rounded-t-md bg-white/[0.04]">
                    {point.total > 0 && (
                      <motion.div
                        initial={{ scaleY: 0 }}
                        animate={{ scaleY: 1 }}
                        transition={{
                          duration: 0.35,
                          delay: index * 0.04,
                          ease: [0.16, 1, 0.3, 1],
                        }}
                        style={{
                          height: `${totalHeightPct}%`,
                          transformOrigin: 'bottom',
                        }}
                        className={`w-full rounded-t-md transition-colors ${
                          isHovered
                            ? 'bg-[#8B5CF6]'
                            : 'bg-[#8B5CF6]/70 group-hover:bg-[#8B5CF6]'
                        }`}
                      />
                    )}
                  </div>

                  {/* Completed Bar */}
                  <div className="relative flex h-full w-3 sm:w-3.5 items-end rounded-t-md bg-white/[0.04]">
                    {point.completed > 0 && (
                      <motion.div
                        initial={{ scaleY: 0 }}
                        animate={{ scaleY: 1 }}
                        transition={{
                          duration: 0.35,
                          delay: index * 0.04 + 0.05,
                          ease: [0.16, 1, 0.3, 1],
                        }}
                        style={{
                          height: `${completedHeightPct}%`,
                          transformOrigin: 'bottom',
                        }}
                        className={`w-full rounded-t-md transition-colors ${
                          isHovered
                            ? 'bg-[#10B981]'
                            : 'bg-[#10B981]/80 group-hover:bg-[#10B981]'
                        }`}
                      />
                    )}
                  </div>
                </div>

                <div className="mt-2.5 text-center">
                  <span
                    className={`block text-xs font-medium ${
                      isToday ? 'text-[#8B5CF6]' : 'text-slate-400'
                    }`}
                  >
                    {point.label}
                  </span>
                  <span className="block text-[11px] text-slate-500 tabular-nums">
                    {point.total}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 tabular-nums">
          <span>
            {totalInWeek === 0
              ? 'No tasks scheduled or created in the last 7 days.'
              : `${completedInWeek} completed out of ${totalInWeek} tasks in the last 7 days`}
          </span>
          <span className="text-slate-500">Hover a day for details</span>
        </div>
      </div>
    </section>
  );
}
