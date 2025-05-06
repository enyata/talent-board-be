import { JwtPayload } from "jsonwebtoken";

export interface IResponseError {
  status: string;
  message: string;
}

export interface CustomJwtPayload extends JwtPayload {
  id: string;
  role: "talent" | "recruiter";
}

export interface UploadConfig {
  destinationFolder: string;
  fieldname: string;
  allowedMimeTypes: string[];
  maxSizeMB?: number;
}

export interface CreateSendTokenOptions {
  mode?: "json" | "redirect";
}
