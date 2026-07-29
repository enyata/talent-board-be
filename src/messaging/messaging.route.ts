import { UserRole } from "@src/entities/user.entity";
import { checkRole } from "@src/middlewares/checkRole";
import { deserializeUser } from "@src/middlewares/deserializeUser";
import { validateData } from "@src/middlewares/validateData";
import { Router } from "express";
import {
  createMessageRequest,
  getIncomingMessageRequests,
  getOutgoingMessageRequests,
} from "./messaging.controller";
import {
  createMessageRequestSchema,
  listMessageRequestsSchema,
} from "./schemas/messageRequest.schema";

const router = Router();

router.use(deserializeUser);

router.post(
  "/requests",
  checkRole(UserRole.RECRUITER),
  validateData(createMessageRequestSchema),
  createMessageRequest,
);

router.get(
  "/requests/incoming",
  checkRole(UserRole.TALENT),
  validateData(listMessageRequestsSchema, ["query"]),
  getIncomingMessageRequests,
);

router.get(
  "/requests/outgoing",
  checkRole(UserRole.RECRUITER),
  validateData(listMessageRequestsSchema, ["query"]),
  getOutgoingMessageRequests,
);

export default router;
