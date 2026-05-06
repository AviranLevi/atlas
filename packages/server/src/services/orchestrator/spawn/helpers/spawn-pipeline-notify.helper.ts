/**
 * Fire-and-forget: notifies the pipeline runner that a workspace transitioned
 * to a terminal state so it can auto-review, pause on failure, or wait for
 * approval. Dynamic import breaks the circular dependency with services/index.
 */
export function notifyPipelineTransition(
  workspaceId: string,
  status: 'completed' | 'failed',
  agentRuntime?: string | null,
): void {
  import('../../../index.js')
    .then(({ pipelinesService }) =>
      pipelinesService.onWorkspaceTransition(workspaceId, status, agentRuntime ?? undefined).catch(() => {}),
    )
    .catch(() => {});
}
