import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { Action } from './core/action';

const CopilotCtx = createContext<CopilotState | null>(null);

export function CopilotProvider({ children }: { children: ReactNode }) {
  const [actions] = useState(() => new Map<string, Action>());
  const [contexts] = useState(() => new Map<string, SkillEntry>());
  const [open,setOpen] = useState<boolean>(false)
  const [copilotType,setCopilotType] = useState<'floating'|'side'>('floating')

  const registerAction = useCallback((a: Action) => {
    actions.set(a.name, a);
    return () => { actions.delete(a.name); };
  }, [actions]);

  const registerSkill = useCallback((c: SkillEntry) => {
    contexts.set(c.id, c);
    return () => { contexts.delete(c.id); };
  }, [contexts]);

  return (
    <CopilotCtx.Provider value={{ actions,isCopilotOpen:open,setOpen,copilotType,setCopilotType, contexts, registerAction, registerSkill }}>
      {children}
    </CopilotCtx.Provider>
  );
}

export const useCopilot = () => {
  const ctx = useContext(CopilotCtx);
  if (!ctx) throw new Error('useCopilot must be inside CopilotProvider');
  return ctx;
};