import { AnimatePresence, motion } from 'framer-motion';
import { useToastStore, type ToastType } from '../store/toastStore';

const STYLE: Record<ToastType, string> = {
  error: 'bg-red-500/90 border-red-300/30',
  success: 'bg-emerald-500/90 border-emerald-300/30',
  info: 'bg-ink-700/95 border-white/10',
};

const ICON: Record<ToastType, string> = {
  error: '✕',
  success: '✓',
  info: 'i',
};

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-xs flex-col gap-2">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.button
            key={t.id}
            layout
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, transition: { duration: 0.2 } }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            onClick={() => dismiss(t.id)}
            className={`pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm font-medium text-white shadow-2xl backdrop-blur ${STYLE[t.type]}`}
          >
            <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white/20 text-xs font-bold">
              {ICON[t.type]}
            </span>
            <span className="flex-1">{t.message}</span>
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
}
