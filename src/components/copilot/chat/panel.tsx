import { useState } from 'react'
import {
  Camera,
  Mic,
  MoreHorizontal,
  Plus,
  ArrowUp,
  SquarePen,
  X,
  ArrowUpDownIcon,
  ChevronsUpDownIcon,
  LucideSidebarOpen,
  PictureInPicture2Icon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import AiIcon from './icon.png'
import { Choose, Otherwise, When } from '@/components/logics/chooseWhen'
import { useCopilot } from '../copilot'

type Props = {
  open: boolean
  onClose: () => void
}

const SUGGESTIONS = [

]

export function CopilotPanel({ open, onClose }: Props) {
  const [value, setValue] = useState('')
  const {copilotType,setCopilotType} = useCopilot()

  return (
    <div
      role="dialog"
      aria-label="Copilot"
      aria-hidden={!open}
      className={ 
        copilotType == "side"? cn(
        "h-screen border-l overflow-x-hidden overflow-y-auto",
        "transition-transform duration-200 ease-out",
        " flex flex-col",
        open
          ? 'w-96'
          : 'w-0',
      ) :
       cn(
        'fixed bottom-6 right-6 z-50 flex flex-col overflow-hidden',
        'rounded-2xl border border-neutral-200 bg-[#fdfdfd] shadow-lg shadow-black/20',
        'origin-bottom-right transition-all duration-200 ease-out',
        'h-[90vh] w-[550px]',
        open
          ? 'pointer-events-auto translate-y-0 scale-100 opacity-100'
          : 'pointer-events-none translate-y-2 scale-95 opacity-0',
      )}
    >
      <header className="flex items-center justify-between px-3 py-2.5">
        <button
          type="button"
          aria-label="New chat"
          className="rounded-md p-1.5 text-neutral-400 hover:bg-neutral-100"
        >
          <SquarePen className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            aria-label="Close"
            onClick={()=>{
              setCopilotType(
                copilotType==="floating"?"side":'floating'
              )
            }}
            className="rounded-md p-1.5 flex flex-row items-center text-neutral-600 hover:bg-neutral-100"
          >
            <Choose>
              <When condition={copilotType==="floating"}>
                 <PictureInPicture2Icon className='size-5'/>
              </When>
              <Otherwise>
                <LucideSidebarOpen className='size-5'/>
              </Otherwise>
            </Choose>
            <ChevronsUpDownIcon className='size-4'/>
          </button>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="rounded-md p-1.5 text-neutral-600 hover:bg-neutral-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-violet-50 text-violet-600">
          <img src={AiIcon} className="h-8 w-8" />
        </div>
        <h3 className="mt-4 text-base font-semibold text-neutral-900">
          How can I help?
        </h3>
        <p className="mt-1 text-sm text-neutral-500">
          Ask anything about your workflows, data, or this page.
        </p>
      </div>
      <div className="px-3 pb-3">
        <div className="mb-2 flex flex-wrap gap-1.5">
          {SUGGESTIONS.map(({ label, icon: Icon }) => (
            <button
              key={label}
              type="button"
              className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-200"
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>
        <div className="rounded-2xl border border-neutral-100 shadow-md bg-white">
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            rows={1}
            placeholder="Ask a question about this page..."
            className="block max-h-32 w-full resize-none rounded-2xl p-4 text-neutral-700 placeholder:text-neutral-400 focus:outline-none"
          />
          <div className="flex items-center justify-between px-2 pb-2">
            <div className="flex justify-end w-full items-center gap-0.5 text-neutral-500">
              <button
                type="button"
                aria-label="Attach"
                className="rounded-md text-neutral-400 p-1.5 hover:text-neutral-800"
              >
                <Plus className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="More"
                className="rounded-md text-neutral-400 p-1.5 hover:text-neutral-800"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Camera"
                className="rounded-md text-neutral-400 p-1.5 hover:text-neutral-800"
              >
                <Camera className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Voice"
                className="rounded-md text-neutral-400 p-1.5 hover:text-neutral-800"
              >
                <Mic className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Send"
                disabled={!value.trim()}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#4E4E94] text-white transition-colors hover:bg-violet-700 disabled:bg-neutral-200 disabled:text-neutral-400"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
