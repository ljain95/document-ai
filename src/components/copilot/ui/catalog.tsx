// copilot/ui-catalog.tsx
import { type ReactNode } from 'react';

export const UI_CATALOG = {
  Stack: ({ direction = 'vertical', gap = 8, children }: { direction?: 'horizontal' | 'vertical'; gap?: number; children?: ReactNode }) => (
    <div style={{ display: 'flex', flexDirection: direction === 'horizontal' ? 'row' : 'column', gap }}>{children}</div>
  ),

  Card: ({ title, children }: { title?: string; children?: ReactNode }) => (
    <div style={{ border: '1px solid #e5e5e5', borderRadius: 8, padding: 12, background: 'white' }}>
      {title && <div style={{ fontWeight: 600, marginBottom: 6 }}>{title}</div>}
      {children}
    </div>
  ),

  Heading: ({ text, level = 2 }: { text: string; level?: 1 | 2 | 3 }) => {
    const Tag = `h${level}` as 'h1' | 'h2' | 'h3';
    return <Tag style={{ margin: '8px 0' }}>{text}</Tag>;
  },

  Text: ({ text, muted = false }: { text: string; muted?: boolean }) => (
    <p style={{ margin: '4px 0', color: muted ? '#777' : '#222', fontSize: 14 }}>{text}</p>
  ),

  Stat: ({ label, value, trend }: { label: string; value: string | number; trend?: 'up' | 'down' | 'flat' }) => (
    <div>
      <div style={{ fontSize: 12, color: '#777' }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 600 }}>
        {value}
        {trend && <span style={{ fontSize: 14, marginLeft: 6, color: trend === 'up' ? '#0a0' : trend === 'down' ? '#c00' : '#777' }}>
          {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
        </span>}
      </div>
    </div>
  ),

  Badge: ({ text, tone = 'neutral' }: { text: string; tone?: 'neutral' | 'success' | 'warning' | 'danger' }) => {
    const colors = {
      neutral: { bg: '#eee', fg: '#333' },
      success: { bg: '#dfd', fg: '#070' },
      warning: { bg: '#ffe', fg: '#860' },
      danger: { bg: '#fdd', fg: '#900' },
    }[tone];
    return <span style={{ background: colors.bg, color: colors.fg, padding: '2px 8px', borderRadius: 10, fontSize: 12 }}>{text}</span>;
  },

  Table: ({ columns, rows }: { columns: string[]; rows: (string | number)[][] }) => (
    <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 13 }}>
      <thead>
        <tr>{columns.map((c) => <th key={c} style={{ textAlign: 'left', padding: 6, borderBottom: '1px solid #ddd' }}>{c}</th>)}</tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i}>{row.map((cell, j) => <td key={j} style={{ padding: 6, borderBottom: '1px solid #f0f0f0' }}>{cell}</td>)}</tr>
        ))}
      </tbody>
    </table>
  ),

  Button: ({ label, action, params }: { label: string; action: string; params?: Record<string, any> }) => {
    // Button clicks send a message back to the chat, triggering the action
    return (
      <button
        onClick={() => sendCopilotMessage(`run action: ${action} with ${JSON.stringify(params || {})}`)}
        style={{ padding: '6px 12px', border: '1px solid #ddd', borderRadius: 6, background: 'white', cursor: 'pointer' }}
      >
        {label}
      </button>
    );
  },

  Divider: () => <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '8px 0' }} />,
};

export type UISpec = {
  component: keyof typeof UI_CATALOG;
  props?: Record<string, any>;
  children?: UISpec[];
};

// Placeholder — wire to your chat in real code
declare function sendCopilotMessage(msg: string): void;