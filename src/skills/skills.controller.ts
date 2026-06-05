import asyncHandler from "@src/middlewares/asyncHandler";
import { Request, Response } from "express";
import { SkillsService } from "./skills.service";

const service = new SkillsService();

export const getAllSkillsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const query = req.query.query as string;
    const skills = await service.getAllSkills(query);
    res.status(200).json({
      status: "success",
      data: {
        skills,
      },
    });
  },
);

export const createSkillHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { name } = req.body;
    const skill = await service.createSkill(name);
    res.status(201).json({
      status: "success",
      data: {
        skill,
      },
    });
  },
);
