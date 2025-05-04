import { AppError } from "@src/exceptions/appError";
import { UploadConfig } from "@src/interfaces";
import { Request } from "express";
import multer, { StorageEngine } from "multer";
import path from "path";

export const createFileUploader = ({
  destinationFolder,
  fieldname,
  allowedMimeTypes,
  maxSizeMB = 2,
}: UploadConfig) => {
  const storage: StorageEngine = multer.diskStorage({
    destination: (
      _req: Request,
      _file: Express.Multer.File,
      cb: (error: Error | null, destination: string) => void,
    ) => {
      cb(null, destinationFolder);
    },
    filename: (
      _req: Request,
      file: Express.Multer.File,
      cb: (error: Error | null, filename: string) => void,
    ) => {
      const ext = path.extname(file.originalname);
      const uniqueName = `${Date.now()}-${file.fieldname}${ext}`;
      cb(null, uniqueName);
    },
  });

  const fileFilter = (
    _req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, isUploaded: boolean) => void,
  ) => {
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new AppError(
          `Only ${allowedMimeTypes.join(", ")} files are allowed`,
          400,
        ),
        false,
      );
    }
  };

  return multer({
    storage,
    limits: { fileSize: maxSizeMB * 1024 * 1024 },
    fileFilter,
  }).single(fieldname);
};
