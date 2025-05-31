import { createFileUploader } from "@src/utils/createFileUploader";

const destinationFolder = process.env.UPLOADS_DIR || "uploads/avatars";

export const uploadAvatar = createFileUploader({
  destinationFolder,
  fieldname: "avatar",
  allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
});
