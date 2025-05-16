import asyncHandler from "@src/middlewares/asyncHandler";
import { Request, Response } from "express";
import { TalentService } from "./talent.service";

const talentService = new TalentService();

export const saveTalent = asyncHandler(async (req: Request, res: Response) => {
  const talentId = req.params.id;
  const recruiterId = req.user.id;
  await talentService.saveTalent(talentId, recruiterId);
  res
    .status(201)
    .json({ status: "success", message: "Talent saved successfully" });
});
