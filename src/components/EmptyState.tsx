import { LucideIcon, Plus } from 'lucide-react';
import { motion } from 'motion/react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  primaryActionLabel,
  onPrimaryAction,
  secondaryActionLabel,
  onSecondaryAction,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#171F35]/70 px-6 py-12 text-center shadow-lg shadow-black/15"
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#8B5CF6]/[0.07] via-[#3B82F6]/[0.04] to-transparent"
        aria-hidden="true"
      />

      <div className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-[#8B5CF6]/20 to-[#3B82F6]/20 text-[#8B5CF6] shadow-inner">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </div>

      <h3 className="relative mt-4 font-display text-base sm:text-lg font-semibold text-white">
        {title}
      </h3>
      <p className="relative mx-auto mt-1.5 max-w-md text-sm text-slate-400 leading-relaxed">
        {description}
      </p>

      {(primaryActionLabel || secondaryActionLabel) && (
        <div className="relative mt-6 flex flex-wrap items-center justify-center gap-3">
          {secondaryActionLabel && onSecondaryAction && (
            <button
              type="button"
              onClick={onSecondaryAction}
              className="inline-flex min-h-[42px] items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-white/[0.08] hover:text-white whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6]"
            >
              {secondaryActionLabel}
            </button>
          )}
          {primaryActionLabel && onPrimaryAction && (
            <button
              type="button"
              onClick={onPrimaryAction}
              className="inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] px-4 py-2 text-sm font-semibold text-white shadow-md shadow-[#8B5CF6]/20 transition-opacity hover:opacity-95 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6]"
            >
              <Plus className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{primaryActionLabel}</span>
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}
