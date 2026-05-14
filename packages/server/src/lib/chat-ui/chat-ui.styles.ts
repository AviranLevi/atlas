/**
 * Self-contained stylesheet for chat-UI cards rendered in sandboxed iframes.
 * Cards inherit nothing from the parent app — all tokens are defined here.
 * Dark mode is handled via `prefers-color-scheme`; light overrides follow.
 */
export const BASE_CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 13px;
    line-height: 1.5;
    color: #e2e8f0;
    background: transparent;
    padding: 0;
    overflow-y: auto;
  }
  @media (prefers-color-scheme: light) {
    body { color: #1e293b; }
    .card { background: #f8fafc; border-color: #e2e8f0; }
    .heading { color: #0f172a; }
    .muted { color: #64748b; }
    .step-num { background: #e2e8f0; color: #475569; }
    .step-done .step-num { background: #dcfce7; color: #16a34a; }
    .badge { background: #f1f5f9; color: #64748b; }
    .divider { border-color: #e2e8f0; }
    .item-row:hover { background: #f1f5f9; }
  }
  .card {
    background: #1e293b;
    border: 1px solid #334155;
    border-radius: 8px;
    overflow: hidden;
  }
  .card-header {
    padding: 10px 14px 8px;
    border-bottom: 1px solid #334155;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .card-icon { font-size: 14px; }
  .heading { font-size: 13px; font-weight: 600; color: #f1f5f9; flex: 1; }
  .muted { color: #94a3b8; font-size: 12px; }
  .card-body { padding: 10px 14px; }
  .step-num {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #334155;
    color: #94a3b8;
    font-size: 11px;
    font-weight: 600;
    flex-shrink: 0;
  }
  .step-done .step-num { background: #14532d; color: #4ade80; }
  .step-row {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 5px 0;
  }
  .step-content { flex: 1; min-width: 0; }
  .step-title { font-weight: 500; color: #e2e8f0; }
  .step-detail { color: #94a3b8; font-size: 12px; margin-top: 2px; }
  .divider { border: none; border-top: 1px solid #334155; margin: 6px 0; }
  .badge {
    display: inline-block;
    padding: 1px 6px;
    border-radius: 4px;
    background: #1e293b;
    color: #94a3b8;
    font-size: 11px;
    border: 1px solid #334155;
  }
  .item-row {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 6px;
    border-radius: 4px;
    cursor: default;
  }
  .item-row:hover { background: #334155; }
  .item-bullet { color: #64748b; }
  .section-label {
    font-size: 11px;
    font-weight: 600;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 6px 0 4px;
  }
  .action-bar {
    display: flex;
    gap: 6px;
    padding: 8px 14px;
    border-top: 1px solid #334155;
    flex-wrap: wrap;
  }
  .btn {
    padding: 5px 12px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    border: none;
    transition: opacity 0.15s;
  }
  .btn:hover { opacity: 0.85; }
  .btn-primary { background: #3b82f6; color: #fff; }
  .btn-secondary { background: #334155; color: #e2e8f0; }
  .btn-danger { background: #dc2626; color: #fff; }
`;
