import type { DocType } from '@atlas/shared';
import type { FileText } from 'lucide-react';

export type SelectedItem = { kind: 'doc'; id: string } | { kind: 'ai-type'; type: DocType } | null;

export type TypeConfigEntry = { label: string; icon: typeof FileText; group: string };
