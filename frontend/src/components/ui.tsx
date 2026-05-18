import {
  ButtonHTMLAttributes,
  HTMLAttributes,
  InputHTMLAttributes,
  LabelHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
} from 'react'
import { LoaderCircle } from 'lucide-react'
import { cx } from '../lib/classes'

const fieldClasses =
  'w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 hover:border-zinc-700 focus:border-emerald-400/70 focus:ring-2 focus:ring-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-60'

type ButtonVariant = 'primary' | 'secondary' | 'ghost'

const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    'border-emerald-500/70 bg-emerald-400 text-zinc-950 hover:border-emerald-300 hover:bg-emerald-300',
  secondary: 'border-zinc-800 bg-zinc-900 text-zinc-100 hover:border-zinc-700 hover:bg-zinc-800',
  ghost: 'border-transparent bg-transparent text-zinc-300 hover:border-zinc-800 hover:bg-zinc-900',
}

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  leftIcon?: ReactNode
  loading?: boolean
  rightIcon?: ReactNode
  variant?: ButtonVariant
}

export function Button({
  children,
  className,
  disabled,
  leftIcon,
  loading,
  rightIcon,
  type = 'button',
  variant = 'secondary',
  ...props
}: ButtonProps) {
  return (
    <button
      className={cx(
        'inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-emerald-400/25 disabled:cursor-not-allowed disabled:opacity-55',
        buttonVariants[variant],
        className,
      )}
      disabled={disabled || loading}
      type={type}
      {...props}
    >
      {loading ? <LoaderCircle className="size-4 animate-spin" /> : leftIcon}
      <span>{children}</span>
      {rightIcon}
    </button>
  )
}

export function IconButton({
  children,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cx(
        'inline-flex size-9 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-300 transition hover:border-zinc-700 hover:bg-zinc-800 hover:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-400/25 disabled:cursor-not-allowed disabled:opacity-55',
        className,
      )}
      type="button"
      {...props}
    >
      {children}
    </button>
  )
}

export function Panel({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <section
      className={cx('rounded-lg border border-zinc-800 bg-zinc-950/80 p-4', className)}
      {...props}
    />
  )
}

export function PanelHeader({
  children,
  className,
  icon,
  title,
}: {
  children: ReactNode
  className?: string
  icon: ReactNode
  title: string
}) {
  return (
    <div className={cx('flex items-start gap-3', className)}>
      <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-300">
        {icon}
      </span>
      <div className="min-w-0">
        <h2 className="text-[0.95rem] font-semibold leading-5 text-zinc-100">{title}</h2>
        <p className="mt-1 text-sm leading-5 text-zinc-400">{children}</p>
      </div>
    </div>
  )
}

export function FieldLabel({
  children,
  className,
  ...props
}: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className={cx('grid gap-1.5 text-sm font-semibold text-zinc-200', className)} {...props}>
      {children}
    </label>
  )
}

export function TextField({
  className,
  label,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <FieldLabel>
      <span>{label}</span>
      <input className={cx(fieldClasses, className)} {...props} />
    </FieldLabel>
  )
}

export function TextAreaField({
  className,
  label,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return (
    <FieldLabel>
      <span>{label}</span>
      <textarea className={cx(fieldClasses, 'min-h-32 resize-y leading-6', className)} {...props} />
    </FieldLabel>
  )
}

export function Badge({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={cx(
        'inline-flex items-center rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs font-semibold text-zinc-300',
        className,
      )}
    >
      {children}
    </span>
  )
}
