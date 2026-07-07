import { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";

interface FieldWrapProps {
  label: string;
  hint?: ReactNode;
  error?: string;
  children: ReactNode;
}

/** Label + hint + error shell shared by inputs. */
export function Field({ label, hint, error, children }: FieldWrapProps) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-rose-50/80">{label}</span>
      {children}
      {error ? (
        <span className="mt-1 block text-xs text-red-400">{error}</span>
      ) : (
        hint && <span className="mt-1 block text-xs text-rose-50/40">{hint}</span>
      )}
    </label>
  );
}

const inputClass =
  "w-full rounded-xl border border-white/10 bg-ink-800/60 px-3 py-2.5 text-sm text-rose-50 placeholder:text-rose-50/30 outline-none focus:border-rose-400/50 focus:ring-1 focus:ring-rose-400/30";

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputClass} ${props.className ?? ""}`} />;
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${inputClass} ${props.className ?? ""}`} />;
}
