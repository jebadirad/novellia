export class AppError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public fieldErrors?: Record<string, string[]>,
  ) {
    super(message);
  }
}
export const missing = () =>
  new AppError(404, 'NOT_FOUND', 'This item could not be found. It may have been deleted.');
