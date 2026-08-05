import AppDataSource from "@src/datasource";
import { UserProvider, UserRole } from "@src/entities/user.entity";
import {
  MessageTemplateService,
  RECRUITER_TEMPLATE_IDS,
  TALENT_TEMPLATE_IDS,
} from "@src/messaging/services/messageTemplate.service";

jest.mock("@src/datasource", () => ({
  __esModule: true,
  default: {
    getRepository: jest.fn(),
  },
}));

const mockUserRepo = {
  findOne: jest.fn(),
};

const recruiter = {
  id: "11111111-1111-4111-8111-111111111111",
  first_name: "Cameron",
  talent_profile: null,
};

const talent = {
  id: "22222222-2222-4222-8222-222222222222",
  first_name: "Sharon",
  talent_profile: { job_title: "frontend development" },
};

const localRecruiterWithoutNames = {
  id: "33333333-3333-4333-8333-333333333333",
  first_name: null,
  last_name: null,
  provider: UserProvider.LOCAL,
  role: UserRole.RECRUITER,
  talent_profile: null,
};

const oauthTalentWithNames = {
  id: "44444444-4444-4444-8444-444444444444",
  first_name: "Alex",
  last_name: "Morgan",
  provider: UserProvider.GOOGLE,
  role: UserRole.TALENT,
  talent_profile: null,
};

describe("MessageTemplateService", () => {
  let service: MessageTemplateService;

  beforeEach(() => {
    jest.clearAllMocks();

    (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockUserRepo);
    mockUserRepo.findOne.mockImplementation(({ where }) => {
      if (where.id === recruiter.id) return Promise.resolve(recruiter);
      if (where.id === talent.id) return Promise.resolve(talent);
      if (where.id === localRecruiterWithoutNames.id) {
        return Promise.resolve(localRecruiterWithoutNames);
      }
      if (where.id === oauthTalentWithNames.id) {
        return Promise.resolve(oauthTalentWithNames);
      }
      return Promise.resolve(null);
    });

    service = new MessageTemplateService();
  });

  it("returns recruiter templates for recruiters", async () => {
    const result = await service.getTemplates(UserRole.RECRUITER, {
      target_user_id: talent.id,
    });

    expect(result.templates).toHaveLength(3);
    expect(result.templates.map((template) => template.id)).toEqual([
      RECRUITER_TEMPLATE_IDS.INTRO_OUTREACH,
      RECRUITER_TEMPLATE_IDS.SCHEDULE_INTERVIEW,
      RECRUITER_TEMPLATE_IDS.AVAILABILITY_CHECK,
    ]);
    expect(result.templates[0].body).toContain("Hi Sharon");
  });

  it("returns talent templates for talents", async () => {
    const result = await service.getTemplates(UserRole.TALENT, {
      target_user_id: recruiter.id,
    });

    expect(result.templates).toHaveLength(3);
    expect(result.templates.map((template) => template.id)).toEqual([
      TALENT_TEMPLATE_IDS.EXPRESS_INTEREST,
      TALENT_TEMPLATE_IDS.FOLLOW_UP,
      TALENT_TEMPLATE_IDS.SHARE_PORTFOLIO,
    ]);
    expect(result.templates[0].body).toContain("Hi Cameron");
  });

  it("filters templates by use case", async () => {
    const result = await service.getTemplates(UserRole.RECRUITER, {
      use_case: "intro_note",
      target_user_id: talent.id,
    });

    expect(result.templates.length).toBeGreaterThan(0);
    expect(
      result.templates.every((template) =>
        template.use_cases.includes("intro_note"),
      ),
    ).toBe(true);
  });

  it("returns no talent intro templates because intro notes are recruiter-led", async () => {
    const result = await service.getTemplates(UserRole.TALENT, {
      use_case: "intro_note",
      target_user_id: recruiter.id,
    });

    expect(result.templates).toHaveLength(0);
  });

  it("keeps template IDs unique across all role-based templates", async () => {
    const recruiterTemplates = await service.getTemplates(UserRole.RECRUITER, {
      target_user_id: talent.id,
    });
    const talentTemplates = await service.getTemplates(UserRole.TALENT, {
      target_user_id: recruiter.id,
    });
    const allTemplateIds = [
      ...recruiterTemplates.templates.map((template) => template.id),
      ...talentTemplates.templates.map((template) => template.id),
    ];

    expect(new Set(allTemplateIds).size).toBe(allTemplateIds.length);
  });

  it("falls back to safe defaults when dynamic records are missing", async () => {
    const result = await service.getTemplates(UserRole.TALENT, {
      target_user_id: "99999999-9999-4999-8999-999999999999",
    });

    expect(result.templates[0].body).toContain("Hi there");
  });

  it("uses role as recipient display value when first and last names are missing", async () => {
    const result = await service.getTemplates(UserRole.RECRUITER, {
      target_user_id: localRecruiterWithoutNames.id,
    });

    expect(result.templates[0].body).toContain("Hi Recruiter");
  });

  it("uses oauth recipient name when first and last names are available", async () => {
    const result = await service.getTemplates(UserRole.RECRUITER, {
      target_user_id: oauthTalentWithNames.id,
    });

    expect(result.templates[0].body).toContain("Hi Alex Morgan");
  });
});
