import { createFileUploader } from "@src/utils/createFileUploader";

export const uploadResume = createFileUploader({
  destinationFolder: "uploads/resumes",
  fieldname: "resume",
  allowedMimeTypes: ["application/pdf"],
});
