const UI_DESCRIPTION = `Render a UI component tree in the chat. Use this to display data, summaries, dashboards, or interactive elements.

Available components:
- Stack: layout container. Props: { direction: 'horizontal' | 'vertical', gap: number }
- Card: bordered card. Props: { title?: string }
- Heading: section heading. Props: { text: string, level: 1 | 2 | 3 }
- Text: paragraph. Props: { text: string, muted?: boolean }
- Stat: big-number stat display. Props: { label: string, value: string|number, trend?: 'up'|'down'|'flat' }
- Badge: inline pill label. Props: { text: string, tone: 'neutral'|'success'|'warning'|'danger' }
- Table: tabular data. Props: { columns: string[], rows: (string|number)[][] }
- Button: clickable button that triggers an action. Props: { label: string, action: string, params?: object }
- Divider: horizontal rule. Props: {}

All components except Divider, Heading, Text, Stat, Badge, Button, Table can have children (an array of more UI specs).

Compose layouts with Stack as the outer container and Cards inside.`

const UI_PARAMETERS  = {
    type: 'object',
    properties: {
      spec: {
        type: 'object',
        description: 'A UI spec node: { component, props?, children? }',
      },
    },
    required: ['spec'],
  }

  export {
    UI_DESCRIPTION,UI_PARAMETERS
  }

export { CopilotFloatingButton } from '../chat/floatingButton'
export { CopilotPanel } from '../chat/panel'