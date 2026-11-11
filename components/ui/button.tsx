import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
const buttonVariants = cva('btn', { variants:{ variant:{ default:'', outline:'btn-alt' } }, defaultVariants:{ variant:'default' } })
/** Native-button shadcn-style primitive using the repository's existing CVA/cn stack. */
export function Button({ className, variant, type = 'button', ...props }: React.ComponentProps<'button'> & VariantProps<typeof buttonVariants>) {
  return <button data-slot="button" type={type} className={cn(buttonVariants({ variant,className }))} {...props} />
}
