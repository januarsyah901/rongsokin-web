"use client";

import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2 } from "lucide-react";

const STEP_LABEL: Record<string, string> = {
  PENDING: "Menunggu",
  CONFIRMED: "Diterima",
  ON_THE_WAY: "Perjalanan",
  IN_PROGRESS: "Timbang",
  COMPLETED: "Selesai",
};

const SPRING = { type: "spring", stiffness: 260, damping: 30 } as const;

/**
 * Stepper status pesanan. Tampilan identik dengan versi statis sebelumnya;
 * yang ditambah hanya gerak saat status BERUBAH (render pertama tidak
 * beranimasi — `initial={false}`):
 * - garis progres mengisi dengan pegas,
 * - langkah yang baru aktif "berdenyut" sekali,
 * - nomor → centang berganti dengan pop.
 */
export default function OrderStatusStepper({
  steps,
  currentIdx,
}: {
  steps: string[];
  currentIdx: number;
}) {
  const pct = steps.length > 1 ? (currentIdx / (steps.length - 1)) * 100 : 0;

  return (
    <div className="relative flex justify-between items-center w-full">
      {steps.map((s, idx) => {
        const isPassed = idx < currentIdx;
        const isCurrent = idx === currentIdx;
        const state = isPassed ? "passed" : isCurrent ? "current" : "todo";

        return (
          <div key={s} className="flex flex-col items-center gap-2 z-10">
            <motion.div
              initial={false}
              animate={{ scale: isCurrent ? [1, 1.15, 1] : 1 }}
              transition={{ duration: 0.35, ease: "easeOut", delay: isCurrent ? 0.2 : 0 }}
              className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors duration-300 font-mono text-xs font-bold ${
                isPassed
                  ? "bg-brand-500 border-brand-500 text-ink"
                  : isCurrent
                  ? "border-ink text-ink bg-brand-100 ring-4 ring-brand-100"
                  : "border-ink-faint bg-surface-raised text-ink-faint"
              }`}
            >
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={state === "passed" ? "check" : "num"}
                  className="flex items-center justify-center"
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.4, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 28 }}
                >
                  {isPassed ? <CheckCircle2 size={16} /> : idx + 1}
                </motion.span>
              </AnimatePresence>
            </motion.div>
            <span
              className={`text-[10px] font-bold uppercase tracking-wider transition-colors duration-300 ${
                isCurrent || isPassed ? "text-ink" : "text-mute"
              }`}
            >
              {STEP_LABEL[s] ?? s}
            </span>
          </div>
        );
      })}

      <div className="absolute left-4 right-4 top-4 h-0.5 bg-surface-sunken -z-0">
        <motion.div
          className="h-full bg-brand-500"
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={SPRING}
        />
      </div>
    </div>
  );
}
