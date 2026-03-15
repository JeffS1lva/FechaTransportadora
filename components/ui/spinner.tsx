import { Loader2Icon, type LucideProps } from 'lucide-react'

import { cn } from '@/lib/utils'

type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

type SpinnerProps = Omit<LucideProps, 'size'> & {
  /**
   * Size helper class (e.g. `sm`, `md`, `lg`) or raw SVG `width`/`height` value.
   *
   * - When a supported keyword is provided, the spinner uses Tailwind `size-*`
   *   utility classes.
   * - When a number (or numeric string) is provided, it is forwarded to the
   *   underlying SVG as the `size` prop.
   */
  size?: SpinnerSize | string | number
}

const sizeClassMap: Record<SpinnerSize, string> = {
  xs: 'size-3',
  sm: 'size-4',
  md: 'size-5',
  lg: 'size-6',
  xl: 'size-7',
}

function Spinner({ className, size, ...props }: SpinnerProps) {
  const sizeClass = typeof size === 'string' ? sizeClassMap[size as SpinnerSize] : undefined
  const sizeProp =
    typeof size === 'number' || (typeof size === 'string' && /^[0-9]+$/.test(size))
      ? size
      : undefined

  return (
    <Loader2Icon
      role="status"
      aria-label="Loading"
      className={cn('animate-spin', sizeClass ?? 'size-4', className)}
      size={sizeProp}
      {...props}
    />
  )
}

export { Spinner }
