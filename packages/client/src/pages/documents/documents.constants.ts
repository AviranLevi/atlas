import { Brain, Code2, Database, FileText, Network } from 'lucide-react';

// Types
import type { DocType } from '@atlas/shared';
import type { TypeConfigEntry } from './documents.types';

export const TYPE_CONFIG: Record<DocType, TypeConfigEntry> = {
  'api-diagram': { label: 'API Endpoints', icon: Code2, group: 'Auto-Generated' },
  'db-schema': { label: 'Database Schema', icon: Database, group: 'Auto-Generated' },
  architecture: { label: 'System Architecture', icon: Network, group: 'Auto-Generated' },
  plan: { label: 'Plan', icon: Brain, group: 'Plans' },
  custom: { label: 'Custom', icon: FileText, group: 'Custom' },
};

export const AI_TYPES: DocType[] = ['api-diagram', 'db-schema', 'architecture'];
