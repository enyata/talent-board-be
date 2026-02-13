import { ConflictError } from "../../exceptions/conflictError";
import {
  createSkillHandler,
  getAllSkillsHandler,
} from "../../skills/skills.controller";
import * as skillsServiceModule from "../../skills/skills.service";

const mockRequest = (body: any, query: any) => ({ body, query }) as any;
const mockResponse = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = jest.fn();

describe("Skills Controller", () => {
  let req: any, res: any;

  beforeEach(() => {
    res = mockResponse();
    mockNext.mockClear();
  });

  describe("getAllSkillsHandler", () => {
    it("should return all skills when no query is provided", async () => {
      req = mockRequest({}, {});
      const mockSkills = [
        { id: "1", name: "JavaScript" },
        { id: "2", name: "TypeScript" },
      ];

      jest
        .spyOn(skillsServiceModule.SkillsService.prototype, "getAllSkills")
        .mockResolvedValueOnce(mockSkills as any);

      await getAllSkillsHandler(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: "success",
        data: { skills: mockSkills },
      });
    });

    it("should pass query parameter to service", async () => {
      req = mockRequest({}, { query: "script" });
      const mockSkills = [{ id: "1", name: "JavaScript" }];

      const spy = jest
        .spyOn(skillsServiceModule.SkillsService.prototype, "getAllSkills")
        .mockResolvedValueOnce(mockSkills as any);

      await getAllSkillsHandler(req, res, mockNext);

      expect(spy).toHaveBeenCalledWith("script");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: "success",
        data: { skills: mockSkills },
      });
    });
  });

  describe("createSkillHandler", () => {
    it("should create a new skill successfully", async () => {
      req = mockRequest({ name: "Vue.js" }, {});
      const mockSkill = { id: "3", name: "Vue.js" };

      jest
        .spyOn(skillsServiceModule.SkillsService.prototype, "createSkill")
        .mockResolvedValueOnce(mockSkill);

      await createSkillHandler(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        status: "success",
        data: { skill: mockSkill },
      });
    });

    it("should handle error if skill already exists", async () => {
      req = mockRequest({ name: "React" }, {});

      jest
        .spyOn(skillsServiceModule.SkillsService.prototype, "createSkill")
        .mockRejectedValueOnce(new ConflictError("Skill already exists"));

      await createSkillHandler(req, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ConflictError));
    });
  });
});
