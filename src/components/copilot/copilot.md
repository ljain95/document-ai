# Copilot

Lightweight registry that lets any React component contribute to an AI Copilot:

- **Skills** — readable bits of context (current page, selected node, workbench columns, …) the assistant can inspect.
- **Actions** — callable tools (with JSON-schema parameters) the assistant can invoke. Each action carries a `handler` that runs in the host app, optionally gated on confirmation.

Both are scoped to the React tree, registered on mount and torn down on unmount, so the Copilot's view of the app always matches what's actually on screen.

## Files

- `copilot.tsx` — `CopilotProvider` + `useCopilot()`. Holds two `Map`s (`actions`, `contexts`) and exposes `registerAction` / `registerSkill`, each returning an unregister function.
- `core/state.d.ts` — `CopilotState` shape of the context value.
- `core/action.d.ts` — `Action`: `{ name, description, parameters, handler, requireConfirmation? }`.
- `core/skill.d.ts` — `SkillEntry`: `{ id, description, value }`.
- `hooks/useCopilotAction.ts` — `useCopilotAction(action)`. Re-registers only when `name` changes; keeps `handler` fresh via a ref so closures stay current without churning the registry.
- `hooks/useCopilotSkill.ts` — `useCopilotReadable(entry)`. Re-registers when `id` changes or when `JSON.stringify(value)` changes.

## Wiring

Mount the provider once near the app root (e.g. in `src/main.tsx` or the top-level layout):

```tsx
import { CopilotProvider } from '@/Copilot/copilot'

<CopilotProvider>
  <App />
</CopilotProvider>
```

## Registering a skill (read-only context)

```tsx
import { useCopilotReadable } from '@/Copilot/hooks/useCopilotSkill'

function WorkflowEditor() {
  const baseState = useWorkflowDagStore((s) => s.baseState)
  useCopilotReadable({
    id: 'workflow.current',
    description: 'The workflow currently open in the editor.',
    value: baseState,
  })
  return /* … */
}
```

## Registering an action (tool the assistant can call)

```tsx
import { useCopilotAction } from '@/Copilot/hooks/useCopilotAction'

function SandboxNode({ id }) {
  const updateNodeData = useWorkflowDagStore((s) => s.updateNodeData)
  useCopilotAction({
    name: 'setSandboxLanguage',
    description: 'Switch the language of a Sandbox/Custom Script node.',
    parameters: {
      type: 'object',
      properties: {
        language: { type: 'string', enum: ['javascript', 'python', 'shell'] },
      },
      required: ['language'],
    },
    handler: async ({ language }) => {
      updateNodeData(id, (d) => ({ ...d, config: { ...(d.config ?? {}), language } }))
    },
    requireConfirmation: false,
  })
}
```

## Backend bridge

The chat call lives at `POST /api/ai/chat` (see `frontend/src/constants/endpoints.ts → ENDPOINTS.ai.chat`). A future Copilot UI will serialize the registered `contexts` + `actions` into the request so Claude can both see app state and invoke registered handlers. The registry deliberately stays decoupled from the transport — the maps are the source of truth; whoever drives the chat reads them at send-time.

## Known minor inconsistencies (worth tidying up)

- `core/state.d.ts` references `ContextEntry`, but the actual entry type is `SkillEntry` (in `core/skill.d.ts`). Either rename one, or alias.
- The hook file is `hooks/useCopilotSkill.ts`, but the exported hook is named `useCopilotReadable`. Pick one (probably `useCopilotSkill` to match the file and the registry term) for consistency.
- `Action.parameters` and `Action.handler` use `any`; replace with a stricter JSON-schema type and a generic `<TArgs>` once a couple of real actions land.
