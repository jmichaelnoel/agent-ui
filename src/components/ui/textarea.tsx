import * as React from 'react'

import { cn } from '@/lib/utils'

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  className?: string
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
}

const TextArea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {

    return (
      <textarea
        className={cn(
          'w-full min-h-[40px] max-h-[96px] resize-none bg-transparent shadow-sm',
          'rounded-xl border border-border',
          'px-3 py-2',
          'text-sm leading-5',
          'placeholder:text-muted-foreground',
          'focus-visible:ring-0.5 focus-visible:ring-ring focus-visible:border-primary/50 focus-visible:outline-none',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)

TextArea.displayName = 'TextArea'

export type { TextareaProps }
export { TextArea }
