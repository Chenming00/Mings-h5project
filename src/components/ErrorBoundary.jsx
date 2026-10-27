import { Component } from 'react';

// Last line of defence. Anything that throws during render (a storage
// SecurityError, a malformed projects.json, a bad third-party call) would
// otherwise unmount the tree and leave a blank page with no explanation.
// Styles are inline on purpose: if the stylesheet failed to load, the fallback
// still has to be readable.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Unrecoverable render error', error, info?.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div
        role="alert"
        style={{
          minHeight: '100svh',
          display: 'grid',
          placeContent: 'center',
          gap: '14px',
          padding: '32px 24px',
          textAlign: 'center',
          fontFamily: 'Inter, -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif',
          background: '#fafaf7',
          color: '#30362f',
        }}
      >
        <p style={{ margin: 0, fontSize: '12px', letterSpacing: '2px', color: '#b8542f' }}>
          SOMETHING BROKE
        </p>
        <h1 style={{ margin: 0, fontSize: '24px', lineHeight: 1.4 }}>页面没能加载完成</h1>
        <p style={{ margin: 0, maxWidth: '34em', color: '#6f746b', lineHeight: 1.8 }}>
          可能是浏览器限制了本地存储，或脚本加载被中断。刷新通常可以恢复；如果反复出现，请换一个浏览器试试。
        </p>
        <p style={{ margin: 0, fontFamily: 'ui-monospace, Menlo, monospace', fontSize: '12px', color: '#858a80' }}>
          {String(error?.message || error)}
        </p>
        <div>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              border: 0,
              borderRadius: '999px',
              padding: '11px 26px',
              fontSize: '14px',
              cursor: 'pointer',
              background: '#cc6844',
              color: '#fff',
            }}
          >
            重新加载
          </button>
        </div>
      </div>
    );
  }
}
