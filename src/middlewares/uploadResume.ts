import { createFileUploader } from "@src/utils/createFileUploader";

const destinationFolder = process.env.UPLOADS_DIR || "uploads/resumes";

export const uploadResume = createFileUploader({
  destinationFolder,
  fieldname: "resume",
  allowedMimeTypes: ["application/pdf"],
});
