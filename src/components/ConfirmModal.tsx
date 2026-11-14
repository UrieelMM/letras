import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';

interface Props {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  busy?: boolean;
  error?: string | null;
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
  busy = false,
  error,
  onConfirm,
  onCancel,
}: Props) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement;
    cancelRef.current?.focus();
    return () => {
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  }, [open]);

  useEffect(() => {
    if (open && busy) dialogRef.current?.focus();
    if (open && error && !busy) confirmRef.current?.focus();
  }, [open, busy, error]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[120] grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(event) => {
            if (!busy && event.target === event.currentTarget) onCancel();
          }}
        >
          <motion.div
            role="alertdialog"
            ref={dialogRef}
            tabIndex={-1}
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            aria-busy={busy}
            onKeyDown={(event) => {
              event.stopPropagation();
              if (event.key === 'Escape' && !busy) onCancel();
              if (event.key !== 'Tab') return;
              event.preventDefault();
              if (busy) return;
              const useCancel = event.target === confirmRef.current || (event.shiftKey && event.target === dialogRef.current);
              (useCancel ? cancelRef : confirmRef).current?.focus();
            }}
            className="w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-ink-800 shadow-2xl outline-none"
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
                <h2 id={titleId} className="break-words text-base font-bold text-white">
                  {title}
                </h2>
                <p id={descriptionId} className="mt-1.5 break-words text-sm leading-6 text-white/65">
                  {description}
                </p>
                {error && <p role="alert" className="mt-2 text-sm text-red-300">{error}</p>}
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-white/10 bg-black/10 px-5 py-4">
              <button ref={cancelRef} type="button" className="btn-soft" onClick={onCancel} disabled={busy}>
                {cancelLabel}
              </button>
              <button
                type="button"
                ref={confirmRef}
                className={destructive ? 'btn !bg-red-500 text-white hover:!bg-red-400' : 'btn-accent'}
                onClick={onConfirm}
                disabled={busy}
              >
                {busy ? 'Guardando…' : confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
