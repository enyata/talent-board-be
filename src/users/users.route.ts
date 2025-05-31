import { deserializeUser } from "@src/middlewares/deserializeUser";
import { injectAvatarPath } from "@src/middlewares/injectAvatarPath";
import { uploadAvatar } from "@src/middlewares/uploadAvatar";
import { validateData } from "@src/middlewares/validateData";
import { Router } from "express";
import { updateProfileSchema } from "./schemas/updateProfile.schema";
import { getCurrentUser, updateProfile } from "./users.controller";

const router = Router();

router.get("/me", deserializeUser, getCurrentUser);
router.patch(
  "/me",
  deserializeUser,
  uploadAvatar,
  injectAvatarPath,
  validateData(updateProfileSchema, ["body"]),
  updateProfile,
);

export default router;
