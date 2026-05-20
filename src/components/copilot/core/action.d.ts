import { type ComponentType } from 'react';

type ActionRenderProps = {
  args: any;                             
  status: 'inProgress' | 'executing' | 'complete' | 'error';
  result?: any;
};


interface Action  {
    name: string;
    description: string;
    parameters: Record<string, any>; // JSON Schema
    handler: (args: any) => Promise<any>;
    render?: ComponentType<ActionRenderProps>;
    requireConfirmation?: boolean;
}

export {
    Action
}