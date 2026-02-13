import { ILike } from "typeorm";
import AppDataSource from "../../datasource";
import { SkillEntity } from "../../entities/skill.entity";
import { ConflictError } from "../../exceptions/conflictError";
import { SkillsService } from "../../skills/skills.service";

jest.mock("../../datasource", () => ({
  manager: {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  },
}));

describe("SkillsService", () => {
  let skillsService: SkillsService;
  const mockManager = AppDataSource.manager;

  beforeEach(() => {
    skillsService = new SkillsService();
    jest.clearAllMocks();
  });

  describe("getAllSkills", () => {
    it("should return all skills (limited to 20) when no query provided", async () => {
      const mockSkills = [
        { id: "1", name: "JavaScript" },
        { id: "2", name: "TypeScript" },
      ];
      (mockManager.find as jest.Mock).mockResolvedValue(mockSkills);

      const result = await skillsService.getAllSkills();

      expect(mockManager.find).toHaveBeenCalledWith(SkillEntity, {
        take: 20,
        select: { id: true, name: true },
      });
      expect(result).toEqual(mockSkills);
    });

    it("should return filtered skills when query provided", async () => {
      const query = "script";
      const mockSkills = [
        { id: "1", name: "JavaScript" },
        { id: "2", name: "TypeScript" },
      ];
      (mockManager.find as jest.Mock).mockResolvedValue(mockSkills);

      const result = await skillsService.getAllSkills(query);

      expect(mockManager.find).toHaveBeenCalledWith(SkillEntity, {
        where: { name: ILike(`%${query}%`) },
        take: 20,
        select: { id: true, name: true },
      });
      expect(result).toEqual(mockSkills);
    });
  });

  describe("createSkill", () => {
    it("should create and return a new skill", async () => {
      const skillName = "Vue.js";
      const mockSkill = { id: "3", name: "Vue.js" };

      (mockManager.findOne as jest.Mock).mockResolvedValue(null);
      (mockManager.create as jest.Mock).mockReturnValue(mockSkill);
      (mockManager.save as jest.Mock).mockResolvedValue(mockSkill);

      const result = await skillsService.createSkill(skillName);

      expect(mockManager.findOne).toHaveBeenCalledWith(SkillEntity, {
        where: { name: ILike(skillName) },
      });
      expect(mockManager.create).toHaveBeenCalledWith(SkillEntity, {
        name: skillName,
      });
      expect(mockManager.save).toHaveBeenCalledWith(mockSkill);
      expect(result).toEqual({ id: mockSkill.id, name: mockSkill.name });
    });

    it("should throw ConflictError if skill already exists", async () => {
      const skillName = "React";
      const existingSkill = { id: "4", name: "React" };

      (mockManager.findOne as jest.Mock).mockResolvedValue(existingSkill);

      await expect(skillsService.createSkill(skillName)).rejects.toThrow(
        ConflictError,
      );
      expect(mockManager.create).not.toHaveBeenCalled();
      expect(mockManager.save).not.toHaveBeenCalled();
    });
  });
});
