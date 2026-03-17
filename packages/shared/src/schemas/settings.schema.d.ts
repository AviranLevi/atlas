import { z } from "zod";
export declare const GlobalInstructionsSchema: z.ZodObject<{
    id: z.ZodString;
    content: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    updatedAt: string;
    content: string;
}, {
    id: string;
    updatedAt: string;
    content: string;
}>;
export declare const CreateGlobalInstructionsSchema: z.ZodObject<Pick<{
    id: z.ZodString;
    content: z.ZodString;
    updatedAt: z.ZodString;
}, "content">, "strip", z.ZodTypeAny, {
    content: string;
}, {
    content: string;
}>;
export declare const UpdateGlobalInstructionsSchema: z.ZodObject<{
    content: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    content?: string | undefined;
}, {
    content?: string | undefined;
}>;
export type GlobalInstructions = z.infer<typeof GlobalInstructionsSchema>;
export type CreateGlobalInstructions = z.infer<typeof CreateGlobalInstructionsSchema>;
export type UpdateGlobalInstructions = z.infer<typeof UpdateGlobalInstructionsSchema>;
export declare const DispatchRuleSchema: z.ZodObject<{
    id: z.ZodString;
    pattern: z.ZodString;
    agentId: z.ZodString;
    skillId: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    createdAt: string;
    updatedAt: string;
    agentId: string;
    skillId: string | null;
    pattern: string;
}, {
    id: string;
    createdAt: string;
    updatedAt: string;
    agentId: string;
    skillId: string | null;
    pattern: string;
}>;
export declare const CreateDispatchRuleSchema: z.ZodObject<Pick<{
    id: z.ZodString;
    pattern: z.ZodString;
    agentId: z.ZodString;
    skillId: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "agentId" | "skillId" | "pattern">, "strip", z.ZodTypeAny, {
    agentId: string;
    skillId: string | null;
    pattern: string;
}, {
    agentId: string;
    skillId: string | null;
    pattern: string;
}>;
export declare const UpdateDispatchRuleSchema: z.ZodObject<{
    agentId: z.ZodOptional<z.ZodString>;
    skillId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    pattern: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    agentId?: string | undefined;
    skillId?: string | null | undefined;
    pattern?: string | undefined;
}, {
    agentId?: string | undefined;
    skillId?: string | null | undefined;
    pattern?: string | undefined;
}>;
export type DispatchRule = z.infer<typeof DispatchRuleSchema>;
export type CreateDispatchRule = z.infer<typeof CreateDispatchRuleSchema>;
export type UpdateDispatchRule = z.infer<typeof UpdateDispatchRuleSchema>;
//# sourceMappingURL=settings.schema.d.ts.map