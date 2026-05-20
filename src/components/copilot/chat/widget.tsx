import { CopilotFloatingButton } from '../chat/floatingButton'
import { CopilotPanel } from './panel'
import { useCopilot } from '../copilot'

export function CopilotWidget() {
  const {isCopilotOpen,setOpen} = useCopilot();
  return (
    <>
      <CopilotFloatingButton hidden={isCopilotOpen} onClick={() => setOpen(true)} />
      <CopilotPanel open={isCopilotOpen} onClose={() => setOpen(false)} />
    </>
  )
}
