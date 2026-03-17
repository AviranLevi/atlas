import { z } from "zod";
export declare const AgentSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodNullable<z.ZodString>;
    personality: z.ZodNullable<z.ZodString>;
    unbreakableRules: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    description: string | null;
    personality: string | null;
    unbreakableRules: string | null;
    createdAt: string;
    updatedAt: string;
}, {
    id: string;
    name: string;
    description: string | null;
    personality: string | null;
    unbreakableRules: string | null;
    createdAt: string;
    updatedAt: string;
}>;
export declare const CreateAgentSchema: z.ZodObject<Pick<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodNullable<z.ZodString>;
    personality: z.ZodNullable<z.ZodString>;
    unbreakableRules: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "name" | "description" | "personality" | "unbreakableRules">, "strip", z.ZodTypeAny, {
    name: string;
    description: string | null;
    personality: string | null;
    unbreakableRules: string | null;
}, {
    name: string;
    description: string | null;
    personality: string | null;
    unbreakableRules: string | null;
}>;
export declare const UpdateAgentSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    personality: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    unbreakableRules: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    description?: string | null | undefined;
    personality?: string | null | undefined;
    unbreakableRules?: string | null | undefined;
}, {
    name?: string | undefined;
    description?: string | null | undefined;
    personality?: string | null | undefined;
    unbreakableRules?: string | null | undefined;
}>;
export type Agent = z.infer<typeof AgentSchema>;
export type CreateAgent = z.infer<typeof CreateAgentSchema>;
export type UpdateAgent = z.infer<typeof UpdateAgentSchema>;
//# sourceMappingURL=agents.schema.d.ts.map