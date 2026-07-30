export interface ApiErrorDetail {
  field: string;
  message: string;
}

export class ApiError extends Error {
  readonly status: number;
  readonly errorDetails: ApiErrorDetail[] | null;

  constructor(status: number, message: string, errorDetails: ApiErrorDetail[] | null = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errorDetails = errorDetails;
  }
}

// Backend Zod issues are paths into {body, query, params} (e.g. "body.email",
// "body.slots.0.endTime"). Strip just the outer namespace so the rest maps
// directly onto React Hook Form's (possibly nested/array) field names.
export const stripFieldPrefix = (field: string): string => field.replace(/^(body|query|params)\./, '');
