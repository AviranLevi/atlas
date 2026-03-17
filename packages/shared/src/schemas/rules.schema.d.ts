import { z } from "zod";
export declare const RuleTypeEnum: z.ZodEnum<["Backend", "Frontend", "Godot", "General"]>;
export declare const RuleSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    type: z.ZodEnum<["Backend", "Frontend", "Godot", "General"]>;
    tags: z.ZodArray<z.ZodString, "many">;
    content: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
    type: "Backend" | "Frontend" | "Godot" | "General";
    tags: string[];
    content: string | null;
}, {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
    type: "Backend" | "Frontend" | "Godot" | "General";
    tags: string[];
    content: string | null;
}>;
export declare const CreateRuleSchema: z.ZodObject<Pick<{
    id: z.ZodString;
    name: z.ZodString;
    type: z.ZodEnum<["Backend", "Frontend", "Godot", "General"]>;
    tags: z.ZodArray<z.ZodString, "many">;
    content: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "name" | "type" | "tags" | "content">, "strip", z.ZodTypeAny, {
    name: string;
    type: "Backend" | "Frontend" | "Godot" | "General";
    tags: string[];
    content: string | null;
}, {
    name: string;
    type: "Backend" | "Frontend" | "Godot" | "General";
    tags: string[];
    content: string | null;
}>;
export declare const UpdateRuleSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodEnum<["Backend", "Frontend", "Godot", "General"]>>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    content: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    type?: "Backend" | "Frontend" | "Godot" | "General" | undefined;
    tags?: string[] | undefined;
    content?: string | null | undefined;
}, {
    name?: string | undefined;
    type?: "Backend" | "Frontend" | "Godot" | "General" | undefined;
    tags?: string[] | undefined;
    content?: string | null | undefined;
}>;
export type RuleType = z.infer<typeof RuleTypeEnum>;
export type Rule = z.infer<typeof RuleSchema>;
export type CreateRule = z.infer<typeof CreateRuleSchema>;
export type UpdateRule = z.infer<typeof UpdateRuleSchema>;
//# sourceMappingURL=rules.schema.d.ts.map