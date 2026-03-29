import { z } from "zod";

export const ReviewStatusEnum = z.enum([
  "pending",
  "approved",
  "changes_requested",
]);

export const ReviewerTypeEnum = z.enum(["human", "agent"]);

export const ChecklistItemSchema = z.object({
  item: z.string(),
  checked: z.boolean(),
});

export const ReviewSchema = z.object({
  id: z.string().uuid(),
  taskId: z.string().uuid(),
  reviewerId: z.string().uuid().nullable(),
  reviewerType: ReviewerTypeEnum,
  status: ReviewStatusEnum,
  checklist: z.array(ChecklistItemSchema).nullable(),
  notes: z.string().nullable(),
  decidedAt: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const CreateReviewSchema = z.object({
  taskId: z.string().uuid(),
});

export const UpdateReviewSchema = z.object({
  checklist: z.array(ChecklistItemSchema).optional(),
  notes: z.string().nullable().optional(),
});

export const ReviewDecisionEnum = z.enum(["approved", "changes_requested"]);

export const DecideReviewSchema = z.object({
  decision: ReviewDecisionEnum,
  notes: z.string().nullable().optional(),
});

export type ReviewStatus = z.infer<typeof ReviewStatusEnum>;
export type ReviewerType = z.infer<typeof ReviewerTypeEnum>;
export type ChecklistItem = z.infer<typeof ChecklistItemSchema>;
export type Review = z.infer<typeof ReviewSchema>;
export type CreateReview = z.infer<typeof CreateReviewSchema>;
export type UpdateReview = z.infer<typeof UpdateReviewSchema>;
export const SubmitAiReviewSchema = z.object({
  agentId: z.string().uuid(),
  decision: ReviewDecisionEnum,
  notes: z.string().nullable().optional(),
  checklistUpdates: z.array(z.object({ item: z.string(), checked: z.boolean() })).optional(),
});

export const StartAiReviewSchema = z.object({
  agentRuntimeId: z.string().min(1),
  autoFix: z.boolean().optional().default(false),
});

export type ReviewDecision = z.infer<typeof ReviewDecisionEnum>;
export type DecideReview = z.infer<typeof DecideReviewSchema>;
export type SubmitAiReview = z.infer<typeof SubmitAiReviewSchema>;
export type StartAiReview = z.infer<typeof StartAiReviewSchema>;
