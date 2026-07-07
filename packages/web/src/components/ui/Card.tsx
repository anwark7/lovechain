import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
}

/** Generic surface container used across the app. */
export function Card({ children, className = "", title, subtitle, actions }: CardProps) {
  return (
    <section
      className={`card-sheen rounded-2xl border border-white/10 p-5 backdrop-blur-sm ${className}`}
    >
      {(title || actions) && (
        <header className="mb-4 flex items-start justify-between gap-3">
          <div>
            {title && <h2 className="text-lg font-semibold text-rose-50">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-sm text-rose-50/50">{subtitle}</p>}
          </div>
          {actions}
        </header>
      )}
      {children}
    </section>
  );
}
