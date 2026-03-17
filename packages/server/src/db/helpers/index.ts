export const uuidDefault = (): string => crypto.randomUUID();
export const timestampDefault = (): string => new Date().toISOString();
