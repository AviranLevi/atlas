import { z } from "zod";
export declare const SkillTypeEnum: z.ZodEnum<["Planning", "Coding", "Review", "Architecture / Data", "Planning / Roadmapping", "Design / Systems", "Design", "Design / Balancing"]>;
export declare const SkillSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    type: z.ZodEnum<["Planning", "Coding", "Review", "Architecture / Data", "Planning / Roadmapping", "Design / Systems", "Design", "Design / Balancing"]>;
    steps: z.ZodNullable<z.ZodString>;
    inputFormat: z.ZodNullable<z.ZodString>;
    outputFormat: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
    type: "Planning" | "Coding" | "Review" | "Architecture / Data" | "Planning / Roadmapping" | "Design / Systems" | "Design" | "Design / Balancing";
    steps: string | null;
    inputFormat: string | null;
    outputFormat: string | null;
}, {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
    type: "Planning" | "Coding" | "Review" | "Architecture / Data" | "Planning / Roadmapping" | "Design / Systems" | "Design" | "Design / Balancing";
    steps: string | null;
    inputFormat: string | null;
    outputFormat: string | null;
}>;
export declare const CreateSkillSchema: z.ZodObject<Pick<{
    id: z.ZodString;
    name: z.ZodString;
    type: z.ZodEnum<["Planning", "Coding", "Review", "Architecture / Data", "Planning / Roadmapping", "Design / Systems", "Design", "Design / Balancing"]>;
    steps: z.ZodNullable<z.ZodString>;
    inputFormat: z.ZodNullable<z.ZodString>;
    outputFormat: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "name" | "type" | "steps" | "inputFormat" | "outputFormat">, "strip", z.ZodTypeAny, {
    name: string;
    type: "Planning" | "Coding" | "Review" | "Architecture / Data" | "Planning / Roadmapping" | "Design / Systems" | "Design" | "Design / Balancing";
    steps: string | null;
    inputFormat: string | null;
    outputFormat: string | null;
}, {
    name: string;
    type: "Planning" | "Coding" | "Review" | "Architecture / Data" | "Planning / Roadmapping" | "Design / Systems" | "Design" | "Design / Balancing";
    steps: string | null;
    inputFormat: string | null;
    outputFormat: string | null;
}>;
export declare const UpdateSkillSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodEnum<["Planning", "Coding", "Review", "Architecture / Data", "Planning / Roadmapping", "Design / Systems", "Design", "Design / Balancing"]>>;
    steps: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    inputFormat: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    outputFormat: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    type?: "Planning" | "Coding" | "Review" | "Architecture / Data" | "Planning / Roadmapping" | "Design / Systems" | "Design" | "Design / Balancing" | undefined;
    steps?: string | null | undefined;
    inputFormat?: string | null | undefined;
    outputFormat?: string | null | undefined;
}, {
    name?: string | undefined;
    type?: "Planning" | "Coding" | "Review" | "Architecture / Data" | "Planning / Roadmapping" | "Design / Systems" | "Design" | "Design / Balancing" | undefined;
    steps?: string | null | undefined;
    inputFormat?: string | null | undefined;
    outputFormat?: string | null | undefined;
}>;
export type SkillType = z.infer<typeof SkillTypeEnum>;
export type Skill = z.infer<typeof SkillSchema>;
export type CreateSkill = z.infer<typeof CreateSkillSchema>;
export type UpdateSkill = z.infer<typeof UpdateSkillSchema>;
//# sourceMappingURL=skills.schema.d.ts.map