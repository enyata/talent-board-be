export interface LocalSignupPayload {
  email: string;
  password: string;
}

export interface ResetPasswordPayload {
  email: string;
  token: string;
  password: string;
}
