// copilot/UIRenderer.tsx
import { UI_CATALOG,type UISpec } from './catalog';

export function UIRenderer({ spec }: { spec: UISpec | UISpec[] | null | undefined }) {
  if (!spec) return null;
  if (Array.isArray(spec)) return <>{spec.map((s, i) => <UIRenderer key={i} spec={s} />)}</>;

  // Validate component name
  const Component : any = UI_CATALOG[spec.component];
  if (!Component) {
    return (
      <div style={{ color: '#c00', fontSize: 12, padding: 4 }}>
        Unknown component: {String(spec.component)}
      </div>
    );
  }

  // Render children recursively
  const children = spec.children?.length
    ? spec.children.map((child, i) => <UIRenderer key={i} spec={child} />)
    : undefined;

  try {
    // Spread props with safety — drop any prop named "children" from props to avoid double-passing
    const { children: _ignored, ...safeProps } = spec.props ?? {};
    return <Component {...safeProps}>{children}</Component>;
  } catch (e: any) {
    return <div style={{ color: '#c00', fontSize: 12 }}>Render error in {spec.component}: {String(e)}</div>;
  }
}