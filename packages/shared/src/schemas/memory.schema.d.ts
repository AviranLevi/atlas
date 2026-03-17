import { z } from "zod";
export declare const MemoryTypeEnum: z.ZodEnum<["Decision", "Convention", "Preference", "Problem"]>;
export declare const MemoryScopeEnum: z.ZodEnum<["global", "project"]>;
export declare const MemorySchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    content: z.ZodString;
    type: z.ZodEnum<["Decision", "Convention", "Preference", "Problem"]>;
    scope: z.ZodEnum<["global", "project"]>;
    lastUsed: z.ZodNullable<z.ZodString>;
    projectId: z.ZodNullable<z.ZodString>;
    agentId: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
    type: "Decision" | "Convention" | "Preference" | "Problem";
    content: string;
    scope: "global" | "project";
    lastUsed: string | null;
    projectId: string | null;
    agentId: string | null;
}, {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
    type: "Decision" | "Convention" | "Preference" | "Problem";
    content: string;
    scope: "global" | "project";
    lastUsed: string | null;
    projectId: string | null;
    agentId: string | null;
}>;
export declare const CreateMemorySchema: z.ZodObject<{
    name: z.ZodString;
    content: z.ZodString;
    type: z.ZodEnum<["Decision", "Convention", "Preference", "Problem"]>;
    scope: z.ZodDefault<z.ZodOptional<z.ZodEnum<["global", "project"]>>>;
    lastUsed: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    projectId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    agentId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    type: "Decision" | "Convention" | "Preference" | "Problem";
    content: string;
    scope: "global" | "project";
    lastUsed?: string | null | undefined;
    projectId?: string | null | undefined;
    agentId?: string | null | undefined;
}, {
    name: string;
    type: "Decision" | "Convention" | "Preference" | "Problem";
    content: string;
    scope?: "global" | "project" | undefined;
    lastUsed?: string | null | undefined;
    projectId?: string | null | undefined;
    agentId?: string | null | undefined;
}>;
export declare const UpdateMemorySchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    content: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodEnum<["Decision", "Convention", "Preference", "Problem"]>>;
    scope: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodEnum<["global", "project"]>>>>;
    lastUsed: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    projectId: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    agentId: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    type?: "Decision" | "Convention" | "Preference" | "Problem" | undefined;
    content?: string | undefined;
    scope?: "global" | "project" | undefined;
    lastUsed?: string | null | undefined;
    projectId?: string | null | undefined;
    agentId?: string | null | undefined;
}, {
    name?: string | undefined;
    type?: "Decision" | "Convention" | "Preference" | "Problem" | undefined;
    content?: string | undefined;
    scope?: "global" | "project" | undefined;
    lastUsed?: string | null | undefined;
    projectId?: string | null | undefined;
    agentId?: string | null | undefined;
}>;
export type MemoryType = z.infer<typeof MemoryTypeEnum>;
export type MemoryScope = z.infer<typeof MemoryScopeEnum>;
export type Memory = z.infer<typeof MemorySchema>;
export type CreateMemory = z.infer<typeof CreateMemorySchema>;
export type UpdateMemory = z.infer<typeof UpdateMemorySchema>;
//# sourceMappingURL=memory.schema.d.ts.map