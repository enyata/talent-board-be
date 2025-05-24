import AppDataSource from "@src/datasource";
import { SavedTalentEntity } from "@src/entities/savedTalent.entity";
import { TalentProfileEntity } from "@src/entities/talentProfile.entity";
import { UserEntity } from "@src/entities/user.entity";
import { In, Not } from "typeorm";
import {
  normalizeSkills,
  scoreTalentMatch,
} from "../utils/recommendation.utils";

export class TalentRecommendationService {
  private readonly userRepository = AppDataSource.getRepository(UserEntity);
  private readonly talentRepository =
    AppDataSource.getRepository(TalentProfileEntity);
  private readonly savedTalentRepository =
    AppDataSource.getRepository(SavedTalentEntity);

  async recommendTalents(recruiterId: string) {
    const recruiter = await this.userRepository.findOne({
      where: { id: recruiterId },
      relations: ["recruiter_profile"],
    });

    if (!recruiter || !recruiter.recruiter_profile) return [];

    const savedTalentIds = await this.savedTalentRepository
      .find({
        where: { recruiter: { id: recruiterId } },
        relations: ["talent"],
      })
      .then((records) => records.map((record) => record.talent.id));

    const allTalents = await this.talentRepository.find({
      where: { user: { id: Not(In(savedTalentIds)) } },
      relations: ["user"],
    });

    const recruiterSkills = normalizeSkills(
      recruiter.recruiter_profile.roles_looking_for,
    );

    const scoredTalents = allTalents.map((talent) => {
      const score = scoreTalentMatch(talent, recruiter, recruiterSkills);
      return { talent, score };
    });

    return scoredTalents
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map((entry) => entry.talent);
  }
}
