import {
  BarChart3,
  Briefcase,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  GraduationCap,
  LayoutDashboard,
  ListTodo,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  User,
  X,
} from 'lucide-react';
import { NavSection, TASK_CATEGORIES, TaskCategory } from '../types/task';
import { TaskFlowLogo } from './TaskFlowLogo';

interface SidebarProps {
  activeSection: NavSection;
  selectedCategory: TaskCategory | null;
  onSelectSection: (section: NavSection) => void;
  onSelectCategory: (category: TaskCategory) => void;
  categoryCounts: Record<TaskCategory, number>;
  sectionCounts: {
    all: number;
    today: number;
    upcoming: number;
    completed: number;
  };
  userEmail: string;
  onLogout: () => Promise<void>;
  onQuickAdd: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  onOpenMobile: () => void;
}

const PRIMARY_NAV: {
  id: NavSection;
  label: string;
  icon: typeof LayoutDashboard;
}[] = [
  { id: NavSection.Dashboard, label: 'Dashboard', icon: LayoutDashboard },
  { id: NavSection.MyTasks, label: 'My Tasks', icon: ListTodo },
  { id: NavSection.Today, label: 'Today', icon: CalendarDays },
  { id: NavSection.Upcoming, label: 'Upcoming', icon: CalendarClock },
  { id: NavSection.Completed, label: 'Completed', icon: CheckCircle2 },
  { id: NavSection.Analytics, label: 'Analytics', icon: BarChart3 },
];

const CATEGORY_ICONS: Record<TaskCategory, typeof User> = {
  [TaskCategory.Personal]: User,
  [TaskCategory.College]: GraduationCap,
  [TaskCategory.Work]: Briefcase,
};

function CollapsedTooltip({ label }: { label: string }) {
  return (
    <span
      role="tooltip"
      className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 whitespace-nowrap rounded-lg border border-white/15 bg-[#0B1020] px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-xl transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
    >
      {label}
    </span>
  );
}

export function Sidebar({
  activeSection,
  selectedCategory,
  onSelectSection,
  onSelectCategory,
  categoryCounts,
  sectionCounts,
  userEmail,
  onLogout,
  onQuickAdd,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
  onOpenMobile,
}: SidebarProps) {
  const userInitial = (userEmail?.trim().charAt(0) || 'U').toUpperCase();

  const getNavCount = (id: NavSection): number | null => {
    if (id === NavSection.MyTasks) return sectionCounts.all;
    if (id === NavSection.Today) return sectionCounts.today;
    if (id === NavSection.Upcoming) return sectionCounts.upcoming;
    if (id === NavSection.Completed) return sectionCounts.completed;
    return null;
  };

  const renderSidebarContent = (isMobileDrawer: boolean) => {
    const compact = !isMobileDrawer && isCollapsed;

    return (
      <div className="flex h-full flex-col bg-[#11182B]/95 backdrop-blur-xl text-slate-200 border-r border-white/[0.08]">
        {/* Brand + Collapse/Close */}
        <div
          className={`flex h-16 items-center border-b border-white/[0.08] shrink-0 ${
            compact ? 'justify-center px-2' : 'justify-between px-4'
          }`}
        >
          {!compact && (
            <button
              type="button"
              onClick={() => {
                onSelectSection(NavSection.Dashboard);
                if (isMobileDrawer) onCloseMobile();
              }}
              className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6]"
            >
              <TaskFlowLogo />
            </button>
          )}

          {isMobileDrawer ? (
            <button
              type="button"
              onClick={onCloseMobile}
              aria-label="Close navigation menu"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6]"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-expanded={!isCollapsed}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="group relative inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-slate-400 transition-colors hover:bg-white/[0.08] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6]"
            >
              {isCollapsed ? (
                <PanelLeftOpen className="h-4 w-4" aria-hidden="true" />
              ) : (
                <PanelLeftClose className="h-4 w-4" aria-hidden="true" />
              )}
              {compact && <CollapsedTooltip label="Expand sidebar" />}
            </button>
          )}
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-5 space-y-6">
          <nav aria-label="Main navigation" className="space-y-1">
            {PRIMARY_NAV.map((item) => {
              const Icon = item.icon;
              const isActive =
                activeSection === item.id &&
                !(item.id === NavSection.MyTasks && selectedCategory !== null);
              const count = getNavCount(item.id);

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onSelectSection(item.id);
                    if (isMobileDrawer) onCloseMobile();
                  }}
                  aria-current={isActive ? 'page' : undefined}
                  aria-label={compact ? item.label : undefined}
                  className={`group relative flex w-full min-h-[42px] items-center rounded-xl py-2.5 text-sm font-medium transition-all duration-150 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6] ${
                    compact ? 'justify-center px-2' : 'justify-between gap-3 px-3.5'
                  } ${
                    isActive
                      ? 'bg-gradient-to-r from-[#8B5CF6]/20 to-[#3B82F6]/10 text-white shadow-sm shadow-[#8B5CF6]/10 border border-[#8B5CF6]/25'
                      : 'text-slate-400 hover:bg-white/[0.05] hover:text-slate-100 border border-transparent'
                  }`}
                >
                  <span className="flex items-center gap-3 min-w-0">
                    <Icon
                      className={`h-4 w-4 shrink-0 transition-colors ${
                        isActive
                          ? 'text-[#8B5CF6]'
                          : 'text-slate-400 group-hover:text-slate-200'
                      }`}
                      aria-hidden="true"
                    />
                    {!compact && <span className="truncate">{item.label}</span>}
                  </span>

                  {!compact && count !== null && (
                    <span
                      className={`text-xs tabular-nums ${
                        isActive
                          ? 'font-semibold text-violet-200'
                          : 'text-slate-500'
                      }`}
                    >
                      {count}
                    </span>
                  )}

                  {compact && (
                    <CollapsedTooltip
                      label={
                        count !== null ? `${item.label} (${count})` : item.label
                      }
                    />
                  )}
                </button>
              );
            })}
          </nav>

          <div>
            {!compact && (
              <p className="px-3.5 pb-2 text-xs font-semibold tracking-wide text-slate-500">
                Categories
              </p>
            )}
            <nav aria-label="Task categories" className="space-y-1">
              {TASK_CATEGORIES.map((category) => {
                const Icon = CATEGORY_ICONS[category];
                const isActive =
                  activeSection === NavSection.MyTasks &&
                  selectedCategory === category;

                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => {
                      onSelectCategory(category);
                      if (isMobileDrawer) onCloseMobile();
                    }}
                    aria-current={isActive ? 'page' : undefined}
                    aria-label={compact ? category : undefined}
                    className={`group relative flex w-full min-h-[40px] items-center rounded-xl py-2 text-sm font-medium transition-all duration-150 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6] ${
                      compact
                        ? 'justify-center px-2'
                        : 'justify-between gap-3 px-3.5'
                    } ${
                      isActive
                        ? 'bg-[#3B82F6]/15 text-white border border-[#3B82F6]/30'
                        : 'text-slate-400 hover:bg-white/[0.05] hover:text-slate-100 border border-transparent'
                    }`}
                  >
                    <span className="flex items-center gap-3 min-w-0">
                      <Icon
                        className={`h-4 w-4 shrink-0 ${
                          isActive
                            ? 'text-[#3B82F6]'
                            : 'text-slate-400 group-hover:text-slate-200'
                        }`}
                        aria-hidden="true"
                      />
                      {!compact && <span className="truncate">{category}</span>}
                    </span>
                    {!compact && (
                      <span
                        className={`text-xs tabular-nums ${
                          isActive
                            ? 'font-semibold text-blue-200'
                            : 'text-slate-500'
                        }`}
                      >
                        {categoryCounts[category]}
                      </span>
                    )}
                    {compact && (
                      <CollapsedTooltip
                        label={`${category} (${categoryCounts[category]})`}
                      />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* User Profile & Logout */}
        <div
          className={`border-t border-white/[0.08] shrink-0 space-y-2.5 ${
            compact ? 'p-2.5' : 'p-4'
          }`}
        >
          <div
            className={`group relative flex items-center rounded-xl border border-white/[0.06] bg-[#0B1020]/75 ${
              compact ? 'justify-center p-2' : 'gap-3 px-3 py-2.5'
            }`}
          >
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#8B5CF6]/30 to-[#3B82F6]/30 text-sm font-bold text-white border border-white/10"
              aria-hidden="true"
            >
              {userInitial}
            </div>
            {!compact && (
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium text-slate-400">
                  Signed in
                </p>
                <p
                  className="truncate text-sm font-medium text-white"
                  title={userEmail}
                >
                  {userEmail}
                </p>
              </div>
            )}
            {compact && <CollapsedTooltip label={userEmail} />}
          </div>

          <button
            type="button"
            onClick={() => {
              void onLogout();
            }}
            aria-label={compact ? 'Logout' : undefined}
            className={`group relative flex w-full min-h-[42px] items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] text-sm font-medium text-slate-300 transition-colors hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-300 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6] ${
              compact ? 'px-2' : 'px-3.5 py-2'
            }`}
          >
            <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
            {!compact && <span>Logout</span>}
            {compact && <CollapsedTooltip label="Logout" />}
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Mobile Top Bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b border-white/[0.08] bg-[#11182B]/90 px-4 backdrop-blur-lg lg:hidden">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onOpenMobile}
            aria-label="Open navigation menu"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-200 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6]"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
          <TaskFlowLogo />
        </div>

        <button
          type="button"
          onClick={onQuickAdd}
          className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] px-3.5 py-1.5 text-sm font-semibold text-white shadow-md shadow-[#8B5CF6]/20 transition-opacity hover:opacity-95 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6]"
        >
          <Plus className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>New Task</span>
        </button>
      </header>

      {/* Collapsible Fixed Desktop Sidebar */}
      <aside
        className={`hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:block transition-[width] duration-200 ease-out ${
          isCollapsed ? 'lg:w-[76px]' : 'lg:w-64'
        }`}
      >
        {renderSidebarContent(false)}
      </aside>

      {/* Mobile Slide-Out Drawer */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation"
        >
          <div
            className="fixed inset-0 bg-[#050814]/70 backdrop-blur-xs"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] shadow-2xl">
            {renderSidebarContent(true)}
          </div>
        </div>
      )}
    </>
  );
}
