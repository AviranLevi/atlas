// Lib
import type { ConfirmCardOptions } from '../chat-ui.types.js';
import { CARD_ICONS } from '../chat-ui.constants.js';
import { escHtml, htmlPage, POST_ACTION_SCRIPT } from '../html-shell.js';

/** Renders an action confirmation card with clickable choices. */
export function buildConfirmCard(options: ConfirmCardOptions): string {
  const { question, detail, choices } = options;

  const buttons = choices
    .map(
      (c) =>
        `<button class="btn btn-${c.style ?? 'secondary'}" data-prompt="${escHtml(c.value)}" onclick="sendAction('prompt', { prompt: this.dataset.prompt })">${escHtml(c.label)}</button>`,
    )
    .join('');

  const body = `
    ${POST_ACTION_SCRIPT}
    <div class="card">
      <div class="card-header">
        <span class="card-icon">${CARD_ICONS.confirm}</span>
        <span class="heading">${escHtml(question)}</span>
      </div>
      ${detail ? `<div class="card-body"><span class="muted">${escHtml(detail)}</span></div>` : ''}
      <div class="action-bar">${buttons}</div>
    </div>`;

  return htmlPage(body);
}
