export interface PlanStep {
  step: string;
  detail?: string;
  done?: boolean;
}

export interface PlanCardOptions {
  title: string;
  steps: PlanStep[];
  subtitle?: string;
}

export interface SummarySection {
  heading: string;
  items: string[];
}

export interface SummaryCardOptions {
  title: string;
  sections: SummarySection[];
  icon?: string;
}

export interface ConfirmChoice {
  label: string;
  value: string;
  style?: 'primary' | 'secondary' | 'danger';
  /** Optional icon rendered before the label. */
  icon?: 'agent' | 'task' | 'pipeline' | 'cancel' | 'check';
}

export interface ConfirmCardOptions {
  question: string;
  detail?: string;
  choices: ConfirmChoice[];
}

/** Marker shape returned by UI tools — detected by the service layer to emit ui_resource events. */
export interface UICardResult {
  __uiCard: true;
  html: string;
  /** Tool result to persist alongside (stripped of the __uiCard marker before storing). */
  data?: unknown;
}
