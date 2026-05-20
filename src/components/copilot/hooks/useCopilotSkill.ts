import { useEffect } from 'react';
import { useCopilot } from '../copilot';


export function useCopilotReadable(entry: { id: string; description: string; value: any }) {
    const { registerSkill } = useCopilot();
    useEffect(() => {
      return registerSkill(entry);
    }, [entry.id, JSON.stringify(entry.value)]);
  }