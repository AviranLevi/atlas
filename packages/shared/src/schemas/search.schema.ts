import { z } from "zod";

export const SearchQuerySchema = z.object({
  q: z.string().min(1),
});

export type SearchQuery = z.infer<typeof SearchQuerySchema>;
