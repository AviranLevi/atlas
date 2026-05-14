// Lib
import type { PlanCardOptions } from '../chat-ui.types.js';
import { BUTTON_LABELS, CARD_ICONS, PIPELINE_STEP_THRESHOLD } from '../chat-ui.constants.js';
import { createPipelinePrompt, createTasksPrompt } from '../chat-ui.prompt.js';
import { escHtml, htmlPage, POST_ACTION_SCRIPT } from '../html-shell.js';

/** Renders a numbered plan card with optional per-step details and action buttons. */
export function buildPlanCard(options: PlanCardOptions): string {
  const { title, steps, subtitle } = options;

  const stepRows = steps
    .map(
      (s, i) => `
    <div class="step-row${s.done ? ' step-done' : ''}">
      <span class="step-num">${s.done ? '✓' : i + 1}</span>
      <div class="step-content">
        <div class="step-title">${escHtml(s.step)}</div>
        ${s.detail ? `<div class="step-detail">${escHtml(s.detail)}</div>` : ''}
      </div>
    </div>`,
    )
    .join('');

  const tasksPrompt = createTasksPrompt(title);
  const pipelinePrompt = createPipelinePrompt(title, steps.length);

  const pipelineBtn =
    steps.length >= PIPELINE_STEP_THRESHOLD
      ? `<button class="btn btn-secondary" data-prompt="${escHtml(pipelinePrompt)}" onclick="sendAction('execute', { prompt: this.dataset.prompt })">${BUTTON_LABELS.createPipeline}</button>`
      : '';

  const body = `
    ${POST_ACTION_SCRIPT}
    <div class="card">
      <div class="card-header">
        <span class="card-icon">${CARD_ICONS.plan}</span>
        <span class="heading">${escHtml(title)}</span>
        ${subtitle ? `<span class="muted">${escHtml(subtitle)}</span>` : ''}
      </div>
      <div class="card-body">${stepRows}</div>
      <div class="action-bar">
        <button class="btn btn-primary" data-prompt="${escHtml(tasksPrompt)}" onclick="sendAction('execute', { prompt: this.dataset.prompt })">${BUTTON_LABELS.createTasks}</button>
        ${pipelineBtn}
      </div>
    </div>`;

  return htmlPage(body);
}
