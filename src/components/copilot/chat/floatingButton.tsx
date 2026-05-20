import { cn } from '@/lib/utils'
import Icon from './icon.png'

type Props = {
  onClick: () => void
  hidden?: boolean
  className?: string
}

export function CopilotFloatingButton({ onClick, hidden, className }: Props) {
  return (
    <button
      type="button"
      aria-label="Open Copilot"
      onClick={onClick}
      style={{
        borderWidth:2
      }}
      className={cn(
        'fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full',
        'bg-white text-white shadow-lg shadow-black-600/30 cursor-pointer',
        'transition-all duration-200  border border-violet-400',
        hidden && 'pointer-events-none scale-90 opacity-0',
        className,
      )}
    >
      <img src={Icon} className="h-5 w-5" />
    </button>
  )
}
