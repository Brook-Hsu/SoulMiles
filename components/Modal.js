'use client';

export default function Modal({ title, subtitle, children, onClose, primaryAction }) {
  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-[#1a1410]/95 p-6 text-white shadow-2xl border border-[#8c6b4f]/40 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-sm text-[#fbbf24] hover:text-white transition-colors"
          aria-label="close modal"
        >
          ✕
        </button>
        {title && (
          <div className="mb-4">
            <p className="text-xs uppercase tracking-[0.3em] text-[#fbbf24]/70">SoulMiles</p>
            <h2 className="text-xl font-bold text-[#fde68a]">{title}</h2>
            {subtitle && <p className="text-sm text-[#f1e3c3]/70 mt-1">{subtitle}</p>}
          </div>
        )}
        <div className="space-y-4">{children}</div>
        {primaryAction}
      </div>
    </div>
  );
}

