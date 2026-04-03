export class MockAppError extends Error {
  constructor(message: string, opts?: { cause?: unknown }) {
    super(message);
    this.cause = opts?.cause;
  }
}
