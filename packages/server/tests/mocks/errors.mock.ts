export class MockAppError extends Error {
  public readonly status: number;

  constructor(message: string, opts?: { cause?: unknown; status?: number }) {
    super(message);
    this.cause = opts?.cause;
    this.status = opts?.status ?? 500;
  }
}
