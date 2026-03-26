import { z } from "zod";

export const UpdatePreferencesSchema = z.record(z.string(), z.string());

export type UpdatePreferences = z.infer<typeof UpdatePreferencesSchema>;
