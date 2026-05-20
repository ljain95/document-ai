interface CopilotState{
    actions: Map<string, Action>;
    isCopilotOpen : boolean;
    copilotType : 'floating'|'side'
    setCopilotType : (a: 'floating'|'side') => void;
    setOpen : (a:boolean)=>void;
    contexts: Map<string, ContextEntry>;
    registerAction: (a: Action) => () => void;
    registerSkill: (c: ContextEntry) => () => void;
}