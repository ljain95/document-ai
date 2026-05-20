// copilot/hooks.ts
import { useEffect, useRef } from 'react';
import { useCopilot } from '../copilot';
import { type Action } from '../core/action';

export function useCopilotAction(action: Action) {
  const { registerAction } = useCopilot();
  // Keep handler ref fresh without re-registering on every render
  const ref = useRef(action);
  ref.current = action;

  useEffect(() => {
    return registerAction({
      ...action,
      handler: (args) => ref.current.handler(args),
      render: action.render, // component reference is stable enough
    });
  }, [action.name]); // re-register only if name changes
}
