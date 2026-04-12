/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Set to "true" to enforce API key auth on the client (production / remote mode). Defaults to false in dev. */
  readonly VITE_AUTH_REQUIRED: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
