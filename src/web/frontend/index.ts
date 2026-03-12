import { getCss } from './styles.js';
import { getClientJs } from './scripts.js';

export function getIndexHtml(): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>AI Test Tool</title>
<style>${getCss()}</style>
</head>
<body>

<div class="header">
  <h1><span>AI</span> Test Tool</h1>
  <span class="version">v0.1.0</span>
</div>

<div class="container">
  <!-- Sidebar -->
  <div class="sidebar">
    <div class="section">
      <h2>Project</h2>
      <label>Project Path</label>
      <div class="input-group">
        <input type="text" id="input-path" placeholder="/path/to/your/project">
        <button class="btn btn-secondary btn-sm" id="btn-browse">Browse</button>
      </div>
    </div>

    <div class="section">
      <h2>Configuration</h2>
      <div class="form-row">
        <label>AI Provider</label>
        <select id="sel-provider">
          <option value="gemini">Gemini</option>
          <option value="anthropic">Anthropic</option>
          <option value="openai">OpenAI</option>
        </select>
      </div>
      <div class="form-row">
        <label>Model</label>
        <input type="text" id="input-model" placeholder="e.g. gemini-2.5-pro">
      </div>
      <div class="form-row">
        <label>Category</label>
        <select id="sel-category">
          <option value="">All Categories</option>
          <option value="Frontend">Frontend</option>
          <option value="Backend">Backend</option>
          <option value="WebUI">WebUI</option>
          <option value="MCP">MCP</option>
        </select>
      </div>
      <div class="form-row">
        <label>Mode</label>
        <select id="sel-mode">
          <option value="full">Full</option>
          <option value="incremental">Incremental</option>
        </select>
      </div>
      <div class="checkbox-row">
        <input type="checkbox" id="chk-coverage">
        <label for="chk-coverage" style="margin:0">Enable Coverage</label>
      </div>
      <div class="checkbox-row">
        <input type="checkbox" id="chk-headed">
        <label for="chk-headed" style="margin:0">Headed Browser</label>
      </div>
    </div>

    <div class="action-bar">
      <button class="btn btn-secondary" id="btn-analyze">Analyze</button>
      <button class="btn btn-primary" id="btn-run">Run Tests</button>
    </div>
  </div>

  <!-- Main -->
  <div class="main">
    <div class="tabs">
      <div class="tab active" data-tab="logs">Logs</div>
      <div class="tab" data-tab="results">Results</div>
      <div class="tab" data-tab="report">Report</div>
    </div>

    <div class="progress-bar-container">
      <div class="progress-info">
        <span>0 / 0</span>
        <span>0%</span>
      </div>
      <div class="progress-bar">
        <div class="progress-bar-fill"></div>
      </div>
    </div>

    <div class="tab-content active" id="tab-logs">
      <div class="log-panel" id="log-container">
        <div class="empty-state">
          <div class="icon">&#128196;</div>
          <p>Ready. Select a project and click "Analyze" or "Run Tests" to get started.</p>
        </div>
      </div>
    </div>

    <div class="tab-content" id="tab-results">
      <div class="results-panel" id="results-content">
        <div class="empty-state">
          <div class="icon">&#129514;</div>
          <p>No test results yet. Run tests to see results here.</p>
        </div>
      </div>
    </div>

    <div class="tab-content" id="tab-report">
      <div class="report-panel" id="report-content">
        <div class="empty-state">
          <div class="icon">&#128202;</div>
          <p>No report available. Complete a test run to view the report.</p>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- File Browser Modal -->
<div class="modal-overlay" id="modal-overlay">
  <div class="modal">
    <div class="modal-header">
      <h3>Browse Project Folder</h3>
      <button class="modal-close" id="modal-close">&times;</button>
    </div>
    <div class="modal-current-path" id="modal-current-path">/</div>
    <div class="modal-body" id="file-list"></div>
    <div class="modal-footer">
      <button class="btn btn-secondary btn-sm" id="modal-cancel">Cancel</button>
      <button class="btn btn-primary btn-sm" id="modal-select">Select This Folder</button>
    </div>
  </div>
</div>

<script>${getClientJs()}</script>
</body>
</html>`;
}
