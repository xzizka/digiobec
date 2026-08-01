export interface ConfirmationRowDto {
  label: string;
  value: string;
}

/** JSON view of `GET /api/submissions/{code}/confirmation`. */
export interface ConfirmationDto {
  trackingCode: string;
  formTitle: string;
  submittedAt: string;
  verificationUrl: string;
  rows: ConfirmationRowDto[];
}
