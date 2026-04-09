// Shared
import type { Project } from '@atlas/shared';

import type { MEMORY_TYPE_ORDER } from './brief-generator.constants.js';

/** Nullable `Project.scanData` as used when assembling brief markdown sections. */
export type BriefProjectScanData = Project['scanData'];

/** Memory types emitted under "## Project Knowledge" (subset of memory `type` values). */
export type OrderedBriefMemoryType = (typeof MEMORY_TYPE_ORDER)[number];
