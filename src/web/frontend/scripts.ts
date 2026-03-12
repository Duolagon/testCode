export function getClientJs(): string {
  return `
(function() {
  // State
  let currentRunId = null;
  let eventSource = null;
  let results = [];

  // DOM refs
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  // Tabs
  $$('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      $$('.tab').forEach(t => t.classList.remove('active'));
      $$('.tab-content').forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      $('#tab-' + tab.dataset.tab).classList.add('active');
    });
  });

  // Browse button
  $('#btn-browse').addEventListener('click', () => openBrowser());

  // Analyze button
  $('#btn-analyze').addEventListener('click', runAnalyze);

  // Run button
  $('#btn-run').addEventListener('click', runTests);

  // Modal close
  $('#modal-close').addEventListener('click', closeBrowser);
  $('#modal-cancel').addEventListener('click', closeBrowser);
  $('#modal-overlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeBrowser();
  });

  // File browser
  async function openBrowser() {
    const path = $('#input-path').value || '/';
    $('#modal-overlay').classList.add('visible');
    await loadDirectory(path);
  }

  function closeBrowser() {
    $('#modal-overlay').classList.remove('visible');
  }

  async function loadDirectory(dirPath) {
    try {
      const res = await fetch('/api/browse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: dirPath })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to browse directory');
        return;
      }
      $('#modal-current-path').textContent = data.currentPath;
      const list = $('#file-list');
      list.innerHTML = '';

      // Parent directory
      if (data.parentPath) {
        const item = createFileItem('..', 'dir', data.parentPath);
        list.appendChild(item);
      }

      // Entries
      for (const entry of data.entries) {
        const item = createFileItem(entry.name, entry.type, entry.path);
        list.appendChild(item);
      }
    } catch (err) {
      alert('Browse failed: ' + err.message);
    }
  }

  function createFileItem(name, type, path) {
    const div = document.createElement('div');
    div.className = 'file-item ' + type;
    div.innerHTML = '<span class="icon">' + (type === 'dir' ? '\\ud83d\\udcc1' : '\\ud83d\\udcc4') + '</span><span>' + escapeHtml(name) + '</span>';
    div.addEventListener('click', () => {
      if (type === 'dir') {
        loadDirectory(path);
      }
    });
    // Double click to select directory
    div.addEventListener('dblclick', () => {
      if (type === 'dir') {
        $('#input-path').value = path;
        closeBrowser();
      }
    });
    return div;
  }

  // Select current path button
  $('#modal-select').addEventListener('click', () => {
    const path = $('#modal-current-path').textContent;
    if (path) {
      $('#input-path').value = path;
    }
    closeBrowser();
  });

  // Analyze project
  async function runAnalyze() {
    const path = $('#input-path').value;
    if (!path) { alert('Please enter a project path'); return; }

    switchTab('logs');
    clearLogs();
    addLog('info', 'Analyzing project: ' + path + '...');
    $('#btn-analyze').disabled = true;

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path })
      });
      const data = await res.json();
      if (!res.ok) {
        addLog('error', 'Analysis failed: ' + (data.error || 'Unknown error'));
        return;
      }
      addLog('success', 'Analysis complete!');
      addLog('info', 'Features found: ' + data.features.length);
      for (const f of data.features) {
        addLog('info', '  - ' + f.name + ' (' + f.applicableCategories.join(', ') + ')');
      }
      if (data.frontend.framework) {
        addLog('info', 'Frontend framework: ' + data.frontend.framework);
      }
      if (data.backend.framework) {
        addLog('info', 'Backend framework: ' + data.backend.framework);
      }
      if (data.detectedTestRunner) {
        addLog('info', 'Test runner: ' + data.detectedTestRunner);
      }
    } catch (err) {
      addLog('error', 'Error: ' + err.message);
    } finally {
      $('#btn-analyze').disabled = false;
    }
  }

  // Run tests
  async function runTests() {
    const path = $('#input-path').value;
    if (!path) { alert('Please enter a project path'); return; }

    // Collect config
    const config = {
      path,
      provider: $('#sel-provider').value || undefined,
      model: $('#input-model').value || undefined,
      category: $('#sel-category').value || undefined,
      mode: $('#sel-mode').value || 'full',
      coverage: $('#chk-coverage').checked,
      headed: $('#chk-headed').checked,
    };

    switchTab('logs');
    clearLogs();
    results = [];
    updateResults();
    addLog('info', 'Starting test run...');
    setRunning(true);

    try {
      const res = await fetch('/api/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      const data = await res.json();
      if (!res.ok) {
        addLog('error', 'Failed to start run: ' + (data.error || 'Unknown error'));
        setRunning(false);
        return;
      }

      currentRunId = data.runId;
      addLog('success', 'Run started (ID: ' + currentRunId + ')');

      // Connect SSE
      connectSSE(currentRunId);
    } catch (err) {
      addLog('error', 'Error: ' + err.message);
      setRunning(false);
    }
  }

  function connectSSE(runId) {
    if (eventSource) { eventSource.close(); }
    eventSource = new EventSource('/api/run/' + runId + '/events');

    eventSource.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data);
        handleRunEvent(event);
      } catch {}
    };

    eventSource.onerror = () => {
      eventSource.close();
      eventSource = null;
    };
  }

  function handleRunEvent(event) {
    switch (event.type) {
      case 'step':
        addLog('step', event.data.message || event.data.step);
        break;
      case 'log':
        addLog(event.data.level || 'info', event.data.message);
        break;
      case 'progress':
        if (event.data.progress) {
          showProgress(event.data.progress.current, event.data.progress.total);
        }
        break;
      case 'result':
        if (event.data.result) {
          results.push(event.data.result);
          const r = event.data.result;
          const status = r.status === 'pass' ? 'success' : r.status === 'fail' ? 'error' : 'warn';
          addLog(status, (r.status === 'pass' ? 'PASS' : r.status === 'fail' ? 'FAIL' : r.status.toUpperCase()) + ' ' + r.caseId + ' ' + (r.description || ''));
          updateResults();
        }
        break;
      case 'complete':
        addLog('success', 'Test run completed!');
        if (event.data.summary) {
          const s = event.data.summary;
          addLog('info', 'Total: ' + (s.total || 0) + '  Passed: ' + (s.passed || 0) + '  Failed: ' + (s.failed || 0));
        }
        hideProgress();
        setRunning(false);
        updateResults();
        // Load report
        loadReport(currentRunId);
        if (eventSource) { eventSource.close(); eventSource = null; }
        break;
      case 'error':
        addLog('error', event.data.error || 'Unknown error');
        hideProgress();
        setRunning(false);
        if (eventSource) { eventSource.close(); eventSource = null; }
        break;
    }
  }

  async function loadReport(runId) {
    try {
      const res = await fetch('/api/report/' + runId);
      if (res.ok) {
        const data = await res.json();
        $('#report-content').innerHTML = data.html || ('<pre>' + escapeHtml(data.markdown || 'No report available') + '</pre>');
      }
    } catch {}
  }

  // UI helpers
  function switchTab(name) {
    $$('.tab').forEach(t => t.classList.remove('active'));
    $$('.tab-content').forEach(c => c.classList.remove('active'));
    const tab = document.querySelector('.tab[data-tab="' + name + '"]');
    if (tab) tab.classList.add('active');
    const content = $('#tab-' + name);
    if (content) content.classList.add('active');
  }

  function clearLogs() {
    $('#log-container').innerHTML = '';
  }

  function addLog(level, message) {
    const container = $('#log-container');
    const entry = document.createElement('div');
    entry.className = 'log-entry ' + level;
    const time = new Date().toLocaleTimeString();
    entry.textContent = '[' + time + '] ' + message;
    container.appendChild(entry);
    container.scrollTop = container.scrollHeight;
  }

  function showProgress(current, total) {
    const container = $('.progress-bar-container');
    container.classList.add('visible');
    const pct = total > 0 ? Math.round((current / total) * 100) : 0;
    $('.progress-bar-fill').style.width = pct + '%';
    $('.progress-info span:first-child').textContent = current + ' / ' + total;
    $('.progress-info span:last-child').textContent = pct + '%';
  }

  function hideProgress() {
    $('.progress-bar-container').classList.remove('visible');
  }

  function setRunning(running) {
    $('#btn-run').disabled = running;
    $('#btn-analyze').disabled = running;
    if (running) {
      $('#btn-run').textContent = 'Running...';
    } else {
      $('#btn-run').textContent = 'Run Tests';
    }
  }

  function updateResults() {
    const panel = $('#results-content');
    if (results.length === 0) {
      panel.innerHTML = '<div class="empty-state"><div class="icon">\\ud83e\\uddea</div><p>No test results yet. Run tests to see results here.</p></div>';
      return;
    }

    const passed = results.filter(r => r.status === 'pass').length;
    const failed = results.filter(r => r.status === 'fail').length;
    const total = results.length;
    const passRate = total > 0 ? Math.round((passed / total) * 1000) / 10 : 0;

    let html = '<div class="results-summary">';
    html += '<div class="stat-card total"><div class="stat-value">' + total + '</div><div class="stat-label">Total</div></div>';
    html += '<div class="stat-card passed"><div class="stat-value">' + passed + '</div><div class="stat-label">Passed</div></div>';
    html += '<div class="stat-card failed"><div class="stat-value">' + failed + '</div><div class="stat-label">Failed</div></div>';
    html += '<div class="stat-card"><div class="stat-value">' + passRate + '%</div><div class="stat-label">Pass Rate</div></div>';
    html += '</div>';

    html += '<table class="results-table"><thead><tr>';
    html += '<th>Case ID</th><th>Feature</th><th>Category</th><th>Status</th><th>Duration</th>';
    html += '</tr></thead><tbody>';
    for (const r of results) {
      const duration = r.duration ? (r.duration / 1000).toFixed(1) + 's' : '-';
      html += '<tr>';
      html += '<td>' + escapeHtml(r.caseId || '') + '</td>';
      html += '<td>' + escapeHtml(r.feature || '') + '</td>';
      html += '<td>' + escapeHtml(r.category || '') + '</td>';
      html += '<td><span class="badge ' + (r.status || '') + '">' + (r.status || '').toUpperCase() + '</span></td>';
      html += '<td>' + duration + '</td>';
      html += '</tr>';
      if (r.status === 'fail' && r.errorDetail) {
        html += '<tr><td colspan="5" style="color: var(--danger); font-size: 13px; padding-left: 24px;">' + escapeHtml(r.errorDetail) + '</td></tr>';
      }
    }
    html += '</tbody></table>';

    panel.innerHTML = html;
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // Load config on startup
  async function loadConfig() {
    try {
      const res = await fetch('/api/config');
      if (res.ok) {
        const cfg = await res.json();
        if (cfg.ai?.provider) $('#sel-provider').value = cfg.ai.provider;
        if (cfg.ai?.model) $('#input-model').value = cfg.ai.model;
        if (cfg.projectPath) $('#input-path').value = cfg.projectPath;
      }
    } catch {}
  }

  loadConfig();
})();
`;
}
