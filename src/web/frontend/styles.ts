export function getCss(): string {
  return `
:root {
  --bg: #0f172a;
  --bg-card: #1e293b;
  --bg-input: #334155;
  --border: #475569;
  --text: #e2e8f0;
  --text-dim: #94a3b8;
  --primary: #3b82f6;
  --primary-hover: #2563eb;
  --success: #22c55e;
  --warning: #eab308;
  --danger: #ef4444;
  --radius: 8px;
  --font-mono: 'SF Mono', 'Cascadia Code', 'Fira Code', Consolas, monospace;
}

* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: var(--bg);
  color: var(--text);
  min-height: 100vh;
}

/* Header */
.header {
  background: var(--bg-card);
  border-bottom: 1px solid var(--border);
  padding: 16px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.header h1 {
  font-size: 20px;
  font-weight: 600;
}
.header h1 span { color: var(--primary); }
.header .version { color: var(--text-dim); font-size: 13px; }

/* Layout */
.container {
  display: grid;
  grid-template-columns: 340px 1fr;
  gap: 0;
  height: calc(100vh - 57px);
}

/* Sidebar */
.sidebar {
  background: var(--bg-card);
  border-right: 1px solid var(--border);
  padding: 20px;
  overflow-y: auto;
}
.sidebar h2 {
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-dim);
  margin-bottom: 12px;
}
.section { margin-bottom: 24px; }

/* Form elements */
label {
  display: block;
  font-size: 13px;
  color: var(--text-dim);
  margin-bottom: 6px;
  font-weight: 500;
}
input[type="text"], select {
  width: 100%;
  padding: 8px 12px;
  background: var(--bg-input);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--text);
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}
input[type="text"]:focus, select:focus {
  border-color: var(--primary);
}
.input-group {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}
.input-group input { flex: 1; }

.checkbox-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 14px;
}
.checkbox-row input[type="checkbox"] {
  accent-color: var(--primary);
  width: 16px;
  height: 16px;
}
.form-row { margin-bottom: 12px; }

/* Buttons */
.btn {
  padding: 8px 16px;
  border: none;
  border-radius: var(--radius);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.btn-primary {
  background: var(--primary);
  color: white;
}
.btn-primary:hover { background: var(--primary-hover); }
.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.btn-secondary {
  background: var(--bg-input);
  color: var(--text);
  border: 1px solid var(--border);
}
.btn-secondary:hover { background: var(--border); }
.btn-sm { padding: 6px 12px; font-size: 13px; }

.action-bar {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}
.action-bar .btn { flex: 1; justify-content: center; }

/* Main Content */
.main {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Tabs */
.tabs {
  display: flex;
  background: var(--bg-card);
  border-bottom: 1px solid var(--border);
  padding: 0 16px;
}
.tab {
  padding: 12px 20px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-dim);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}
.tab:hover { color: var(--text); }
.tab.active {
  color: var(--primary);
  border-bottom-color: var(--primary);
}

/* Tab content */
.tab-content { display: none; flex: 1; overflow: hidden; }
.tab-content.active { display: flex; flex-direction: column; }

/* Log panel */
.log-panel {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  font-family: var(--font-mono);
  font-size: 13px;
  line-height: 1.6;
}
.log-entry {
  padding: 2px 0;
  white-space: pre-wrap;
  word-break: break-all;
}
.log-entry.info { color: var(--primary); }
.log-entry.success { color: var(--success); }
.log-entry.warn { color: var(--warning); }
.log-entry.error { color: var(--danger); }
.log-entry.step {
  color: var(--text);
  font-weight: 600;
  margin-top: 8px;
  padding: 4px 0;
  border-bottom: 1px solid var(--border);
}

/* Progress bar */
.progress-bar-container {
  padding: 12px 16px;
  background: var(--bg-card);
  border-bottom: 1px solid var(--border);
  display: none;
}
.progress-bar-container.visible { display: block; }
.progress-info {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: var(--text-dim);
  margin-bottom: 6px;
}
.progress-bar {
  height: 6px;
  background: var(--bg-input);
  border-radius: 3px;
  overflow: hidden;
}
.progress-bar-fill {
  height: 100%;
  background: var(--primary);
  border-radius: 3px;
  transition: width 0.3s;
  width: 0%;
}

/* Results panel */
.results-panel {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}
.results-summary {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}
.stat-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 16px 20px;
  min-width: 120px;
}
.stat-card .stat-value {
  font-size: 28px;
  font-weight: 700;
}
.stat-card .stat-label {
  font-size: 12px;
  color: var(--text-dim);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-top: 4px;
}
.stat-card.passed .stat-value { color: var(--success); }
.stat-card.failed .stat-value { color: var(--danger); }
.stat-card.total .stat-value { color: var(--primary); }

/* Results table */
.results-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}
.results-table th {
  text-align: left;
  padding: 10px 12px;
  font-weight: 600;
  color: var(--text-dim);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid var(--border);
  background: var(--bg-card);
  position: sticky;
  top: 0;
}
.results-table td {
  padding: 10px 12px;
  border-bottom: 1px solid var(--border);
}
.results-table tr:hover { background: rgba(59, 130, 246, 0.05); }

.badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}
.badge.pass { background: rgba(34,197,94,0.15); color: var(--success); }
.badge.fail { background: rgba(239,68,68,0.15); color: var(--danger); }
.badge.blocked { background: rgba(148,163,184,0.15); color: var(--text-dim); }
.badge.skipped { background: rgba(234,179,8,0.15); color: var(--warning); }

/* Report panel */
.report-panel {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  font-size: 14px;
  line-height: 1.7;
}
.report-panel h1, .report-panel h2, .report-panel h3 {
  margin-top: 20px;
  margin-bottom: 10px;
}
.report-panel pre {
  background: var(--bg-input);
  padding: 12px;
  border-radius: var(--radius);
  overflow-x: auto;
  font-family: var(--font-mono);
  font-size: 13px;
}
.report-panel code {
  background: var(--bg-input);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: var(--font-mono);
  font-size: 13px;
}
.report-panel table {
  border-collapse: collapse;
  width: 100%;
  margin: 12px 0;
}
.report-panel th, .report-panel td {
  border: 1px solid var(--border);
  padding: 8px 12px;
  text-align: left;
}

/* File browser modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.6);
  display: none;
  align-items: center;
  justify-content: center;
  z-index: 100;
}
.modal-overlay.visible { display: flex; }
.modal {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  width: 560px;
  max-height: 500px;
  display: flex;
  flex-direction: column;
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
}
.modal-header h3 { font-size: 16px; }
.modal-close {
  background: none;
  border: none;
  color: var(--text-dim);
  font-size: 20px;
  cursor: pointer;
}
.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}
.modal-current-path {
  padding: 8px 20px;
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--text-dim);
  border-bottom: 1px solid var(--border);
}
.file-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 20px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.15s;
}
.file-item:hover { background: var(--bg-input); }
.file-item .icon { width: 20px; text-align: center; }
.file-item.dir .icon { color: var(--primary); }
.file-item.file .icon { color: var(--text-dim); }
.modal-footer {
  padding: 12px 20px;
  border-top: 1px solid var(--border);
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

/* Empty state */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-dim);
  gap: 12px;
}
.empty-state .icon { font-size: 48px; opacity: 0.3; }
.empty-state p { font-size: 14px; }

/* Scrollbar */
::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb {
  background: var(--border);
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover { background: var(--text-dim); }

/* Responsive */
@media (max-width: 768px) {
  .container { grid-template-columns: 1fr; }
  .sidebar { border-right: none; border-bottom: 1px solid var(--border); }
}
`;
}
