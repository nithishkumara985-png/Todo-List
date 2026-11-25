import { ArrowUpDown, Filter, Search, X } from 'lucide-react';
import {
  FilterOption,
  TASK_CATEGORIES,
  TASK_PRIORITIES,
  TaskCategory,
  TaskPriority,
  TaskSortOption,
} from '../types/task';

interface TaskToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  activeFilter: FilterOption;
  onFilterChange: (filter: FilterOption) => void;
  priorityFilter: TaskPriority | 'all';
  onPriorityFilterChange: (priority: TaskPriority | 'all') => void;
  categoryFilter: TaskCategory | 'all';
  onCategoryFilterChange: (category: TaskCategory | 'all') => void;
  sortBy: TaskSortOption;
  onSortChange: (sort: TaskSortOption) => void;
  counts: {
    all: number;
    pending: number;
    completed: number;
  };
  hideStatusTabs?: boolean;
  hideCategorySelect?: boolean;
}

const FILTER_TABS: { label: string; value: FilterOption }[] = [
  { label: 'All', value: FilterOption.All },
  { label: 'Pending', value: FilterOption.Pending },
  { label: 'Completed', value: FilterOption.Completed },
];

export function TaskToolbar({
  searchQuery,
  onSearchChange,
  activeFilter,
  onFilterChange,
  priorityFilter,
  onPriorityFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  sortBy,
  onSortChange,
  counts,
  hideStatusTabs = false,
  hideCategorySelect = false,
}: TaskToolbarProps) {
  const hasExtraFilters =
    priorityFilter !== 'all' ||
    (!hideCategorySelect && categoryFilter !== 'all') ||
    sortBy !== TaskSortOption.Newest;

  return (
    <div className="space-y-3 rounded-2xl border border-white/[0.08] bg-[#171F35]/60 p-4 backdrop-blur-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative flex-1">
          <label htmlFor="task-search-input" className="sr-only">
            Search tasks
          </label>
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            id="task-search-input"
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search tasks by title or description..."
            className="block w-full min-h-[42px] rounded-xl border border-white/10 bg-[#0B1020]/90 pl-10 pr-10 py-2 text-sm text-white placeholder:text-slate-500 transition-colors duration-150 focus:border-[#8B5CF6] focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/25"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6]"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>

        {!hideStatusTabs && (
          <div
            role="tablist"
            aria-label="Filter tasks by status"
            className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-[#0B1020]/90 p-1 shrink-0 overflow-x-auto"
          >
            {FILTER_TABS.map((tab) => {
              const isActive = activeFilter === tab.value;
              const count = counts[tab.value];
              return (
                <button
                  key={tab.value}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => onFilterChange(tab.value)}
                  className={`inline-flex min-h-[34px] items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium whitespace-nowrap shrink-0 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6] ${
                    isActive
                      ? 'bg-[#8B5CF6] text-white shadow-sm shadow-[#8B5CF6]/30'
                      : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-xs tabular-nums ${
                      isActive ? 'text-violet-100' : 'text-slate-500'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Priority, Category & Sort Controls */}
      <div className="flex flex-wrap items-center gap-2.5 pt-1">
        <div className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400">
          <Filter className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
          <span>Filters:</span>
        </div>

        <div>
          <label htmlFor="priority-filter-select" className="sr-only">
            Filter by priority
          </label>
          <select
            id="priority-filter-select"
            value={priorityFilter}
            onChange={(e) =>
              onPriorityFilterChange(e.target.value as TaskPriority | 'all')
            }
            className="min-h-[36px] rounded-xl border border-white/10 bg-[#0B1020]/90 px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors focus:border-[#8B5CF6] focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/25"
          >
            <option value="all">All Priorities</option>
            {TASK_PRIORITIES.map((prio) => (
              <option key={prio} value={prio}>
                {prio} Priority
              </option>
            ))}
          </select>
        </div>

        {!hideCategorySelect && (
          <div>
            <label htmlFor="category-filter-select" className="sr-only">
              Filter by category
            </label>
            <select
              id="category-filter-select"
              value={categoryFilter}
              onChange={(e) =>
                onCategoryFilterChange(e.target.value as TaskCategory | 'all')
              }
              className="min-h-[36px] rounded-xl border border-white/10 bg-[#0B1020]/90 px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors focus:border-[#8B5CF6] focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/25"
            >
              <option value="all">All Categories</option>
              {TASK_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex items-center gap-1.5 sm:ml-auto">
          <ArrowUpDown
            className="h-3.5 w-3.5 text-slate-500"
            aria-hidden="true"
          />
          <label htmlFor="task-sort-select" className="sr-only">
            Sort tasks
          </label>
          <select
            id="task-sort-select"
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as TaskSortOption)}
            className="min-h-[36px] rounded-xl border border-white/10 bg-[#0B1020]/90 px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors focus:border-[#8B5CF6] focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/25"
          >
            <option value={TaskSortOption.Newest}>Sort: Newest First</option>
            <option value={TaskSortOption.DueDate}>Sort: Due Date</option>
            <option value={TaskSortOption.Priority}>Sort: Priority</option>
            <option value={TaskSortOption.Title}>Sort: Title (A–Z)</option>
          </select>
        </div>

        {hasExtraFilters && (
          <button
            type="button"
            onClick={() => {
              onPriorityFilterChange('all');
              onCategoryFilterChange('all');
              onSortChange(TaskSortOption.Newest);
            }}
            className="inline-flex min-h-[36px] items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-medium text-[#3B82F6] transition-colors hover:bg-[#3B82F6]/10"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Reset</span>
          </button>
        )}
      </div>
    </div>
  );
}
