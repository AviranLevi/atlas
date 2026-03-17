export class AppError extends Error {
  public readonly status: number;

  constructor(message: string, options?: { cause?: unknown; status?: number }) {
    super(message, { cause: options?.cause });
    this.name = 'AppError';
    this.status = options?.status ?? 500;
  }
}

export class NotFoundError extends AppError {
  constructor(entity: string, id: string) {
    super(`${entity} not found: ${id}`, { status: 404 });
    this.name = 'NotFoundError';
  }
}
