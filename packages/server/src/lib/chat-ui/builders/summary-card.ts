// Lib
import type { SummaryCardOptions } from '../chat-ui.types.js';
import { CARD_ICONS } from '../chat-ui.constants.js';
import { escHtml, htmlPage, POST_ACTION_SCRIPT } from '../html-shell.js';

/** Renders a grouped summary card (e.g., list_tasks result, search results). */
export function buildSummaryCard(options: SummaryCardOptions): string {
  const { title, sections, icon = CARD_ICONS.summary } = options;

  const sectionHtml = sections
    .map(
      (sec) => `
    <div class="section-label">${escHtml(sec.heading)}</div>
    ${sec.items.map((item) => `<div class="item-row"><span class="item-bullet">▸</span><span>${escHtml(item)}</span></div>`).join('')}
    <hr class="divider" />`,
    )
    .join('');

  const body = `
    ${POST_ACTION_SCRIPT}
    <div class="card">
      <div class="card-header">
        <span class="card-icon">${icon}</span>
        <span class="heading">${escHtml(title)}</span>
      </div>
      <div class="card-body">${sectionHtml}</div>
    </div>`;

  return htmlPage(body);
}
