import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface Props {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  destructive = false,
  onConfirm,
  onCancel,
}: Props) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onCancel]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[120] grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) onCancel();
          }}
        >
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-modal-title"
            aria-describedby="confirm-modal-description"
            className="w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-ink-800 shadow-2xl"
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
          >
            <div className="flex gap-4 p-5">
              <div
                className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${
                  destructive ? 'bg-red-500/15 text-red-300' : 'bg-accent/15 text-accent-soft'
                }`}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-none stroke-current stroke-2">
                  <path d="M12 8v5m0 3.5v.01M10.3 3.8 2.8 17a2 2 0 0 0 1.74 3h14.92a2 2 0 0 0 1.74-3L13.7 3.8a2 2 0 0 0-3.4 0Z" />
                </svg>
              </div>
              <div className="min-w-0">
                <h2 id="confirm-modal-title" className="text-base font-bold text-white">
                  {title}
                </h2>
                <p id="confirm-modal-description" className="mt-1.5 text-sm leading-6 text-white/55">
                  {description}
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-white/10 bg-black/10 px-5 py-4">
              <button ref={cancelRef} type="button" className="btn-soft" onClick={onCancel}>
                {cancelLabel}
              </button>
              <button
                type="button"
                className={destructive ? 'btn !bg-red-500 text-white hover:!bg-red-400' : 'btn-accent'}
                onClick={onConfirm}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
