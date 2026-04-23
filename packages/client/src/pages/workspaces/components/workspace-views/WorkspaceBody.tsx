// Components
import { BrainstormOutputView } from '@/components/workspaces/BrainstormOutputView';
import { PlanOutputView } from '@/components/workspaces/PlanOutputView';
import { WorkflowApprovalPanel } from '@/components/workspaces/WorkflowApprovalPanel';
import { CodeReviewSection, type CodeReviewSectionProps } from './CodeReviewSection';

// Lib
import { assertNever, type WorkspaceView } from '@/pages/workspaces/workspace-view';

// Types
import type { Workspace } from '@atlas/shared';

export type WorkspaceBodyProps = Omit<CodeReviewSectionProps, 'workspace'> & {
  view: WorkspaceView;
  workspace: Workspace;
};

/**
 * Kind-specific body content. Sections that depend purely on `view.caps`
 * (CommitsPanel, agent output) live on the page; this switch handles the
 * per-kind panels so missing arms become compile-time errors.
 */
export function WorkspaceBody(props: WorkspaceBodyProps) {
  const { view, workspace } = props;
  switch (view.kind) {
    case 'active':
    case 'merged':
    case 'terminal':
    case 'rawOutput':
      return null;
    case 'awaitingApproval':
      return <WorkflowApprovalPanel workspace={workspace} />;
    case 'structuredReview':
      return view.structured.stage === 'brainstorm' ? (
        <BrainstormOutputView brainstorm={view.structured.data} />
      ) : (
        <PlanOutputView plan={view.structured.data} />
      );
    // aiReviewing reuses CodeReviewSection so the diff stays mounted while
    // the reviewer agent is live. The banner inside CodeReviewSection picks
    // up the "AI Review in Progress" chip off `review.status === 'pending'`.
    case 'aiReviewing':
    case 'codeReview':
      return <CodeReviewSection {...props} />;
    default:
      return assertNever(view);
  }
}
