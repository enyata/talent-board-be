import { JwtPayload } from "jsonwebtoken";

export interface IResponseError {
  status: string;
  message: string;
}

export interface CustomJwtPayload extends JwtPayload {
  id: string;
}

export interface GoogleProfile {
  first_name: string;
  last_name: string;
  email: string;
  avatar?: string;
}

export interface LinkedInProfile {
  first_name: string;
  last_name: string;
  email: string;
  avatar?: string;
}
