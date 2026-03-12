import { Router } from 'express';
import { getRunState } from '../services/run-manager.js';

export function reportRoutes(_options: { projectPath: string }) {
  const router = Router();

  router.get('/report/:id', (req, res) => {
    const state = getRunState(req.params.id);
    if (!state) {
      res.status(404).json({ error: 'Run not found' });
      return;
    }
    if (!state.report) {
      res.status(404).json({ error: 'Report not available yet' });
      return;
    }

    // Convert markdown to simple HTML
    const html = markdownToHtml(state.report);
    res.json({ markdown: state.report, html });
  });

  return router;
}

function markdownToHtml(md: string): string {
  let html = md
    // Code blocks
    .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
    // Headers
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Horizontal rule
    .replace(/^---$/gm, '<hr>')
    // Lists
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    // Line breaks
    .replace(/\n\n/g, '<br><br>')
    // Tables (basic)
    .replace(/\|(.+)\|/g, (match) => {
      const cells = match.split('|').filter(Boolean).map(c => c.trim());
      if (cells.every(c => /^[-:]+$/.test(c))) return '';
      const tag = 'td';
      return '<tr>' + cells.map(c => `<${tag}>${c}</${tag}>`).join('') + '</tr>';
    });

  // Wrap lists
  html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');

  return html;
}
