interface LoadingRollerProps {
  label?: string
}

export function LoadingRoller({ label = 'جاري التحميل...' }: LoadingRollerProps) {
  return (
    <section className="glass rounded-3xl p-6" aria-live="polite" aria-busy="true">
      <div className="flex items-center gap-4">
        <div className="relative h-10 w-10">
          <span className="absolute inset-0 rounded-full border-2 border-sky-400/25" />
          <span className="absolute inset-0 rounded-full border-2 border-transparent border-t-sky-400 border-r-cyan-300 animate-spin" />
          <span className="absolute inset-2 rounded-full border border-white/10" />
        </div>
        <div>
          <p className="text-sm font-medium text-fintech-text">{label}</p>
          <div className="mt-1 flex gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-300/70 animate-pulse" />
            <span className="h-1.5 w-1.5 rounded-full bg-sky-300/55 animate-pulse [animation-delay:120ms]" />
            <span className="h-1.5 w-1.5 rounded-full bg-sky-300/40 animate-pulse [animation-delay:240ms]" />
          </div>
        </div>
      </div>
    </section>
  )
}
