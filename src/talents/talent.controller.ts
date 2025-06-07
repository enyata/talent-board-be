import asyncHandler from "@src/middlewares/asyncHandler";
import { Request, Response } from "express";
import { TalentService } from "./services/talent.service";

const talentService = new TalentService();

export const saveTalent = asyncHandler(async (req: Request, res: Response) => {
  const talentId = req.params.id;
  const recruiterId = req.user.id;
  await talentService.saveTalent(talentId, recruiterId);
  res
    .status(201)
    .json({ status: "success", message: "Talent saved successfully" });
});

export const searchTalents = asyncHandler(
  async (req: Request, res: Response) => {
    const recruiterId =
      req.user?.role === "recruiter" ? req.user.id : undefined;

    const result = await talentService.searchTalents(req.query, recruiterId);

    res.status(200).json({
      status: "success",
      message: "Talents fetched successfully",
      data: result,
    });
  },
);

export const getTalentById = asyncHandler(
  async (req: Request, res: Response) => {
    const talentId = req.params.id;
    const recruiterId =
      req.user?.role === "recruiter" ? req.user.id : undefined;
    const result = await talentService.getTalentById(talentId, recruiterId);

    res.status(200).json({
      status: "success",
      message: "Talent fetched successfully",
      data: result,
    });
  },
);

export const toggleUpvoteTalent = asyncHandler(
  async (req: Request, res: Response) => {
    const talentId = req.params.id;
    const recruiterId = req.user.id;

    const action = await talentService.toggleUpvoteTalent(
      talentId,
      recruiterId,
    );

    res.status(action === "upvoted" ? 201 : 200).json({
      status: "success",
      message: `Talent ${action} successfully`,
    });
  },
);

export const getSavedTalents = asyncHandler(
  async (req: Request, res: Response) => {
    const recruiterId = req.user.id;
    const result = await talentService.getSavedTalents(recruiterId, req.query);

    res.status(200).json({
      status: "success",
      message: "Saved talents fetched successfully",
      data: result,
    });
  },
);

export const getTopTalents = asyncHandler(
  async (_req: Request, res: Response) => {
    const result = await talentService.getTopTalents(10);
    res.status(200).json({
      status: "success",
      message: "Top talents fetched successfully",
      data: result,
    });
  },
);
