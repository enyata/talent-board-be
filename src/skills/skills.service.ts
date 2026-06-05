import AppDataSource from "@src/datasource";
import { SkillEntity } from "@src/entities/skill.entity";

import { ConflictError } from "@src/exceptions/conflictError";
import { EntityManager, ILike } from "typeorm";

export class SkillsService {
  async getAllSkills(query?: string) {
    const manager = AppDataSource.manager;
    if (query) {
      return await manager.find(SkillEntity, {
        where: { name: ILike(`%${query}%`) },
        take: 20,
        select: { id: true, name: true },
      });
    }
    return await manager.find(SkillEntity, {
      take: 20,
      select: { id: true, name: true },
    });
  }

  async createSkill(name: string) {
    const manager = AppDataSource.manager;
    const existingSkill = await manager.findOne(SkillEntity, {
      where: { name: ILike(name) },
    });

    if (existingSkill) {
      throw new ConflictError("Skill already exists");
    }

    const skill = manager.create(SkillEntity, {
      name,
    });

    const savedSkill = await manager.save(skill);
    return {
      id: savedSkill.id,
      name: savedSkill.name,
    };
  }

  async findOrCreateSkills(
    names: string[],
    transactionalManager?: EntityManager,
  ): Promise<SkillEntity[]> {
    const manager = transactionalManager || AppDataSource.manager;
    const skills: SkillEntity[] = [];

    for (const name of names) {
      let skill = await manager.findOne(SkillEntity, {
        where: { name: ILike(name) },
      });

      if (!skill) {
        skill = manager.create(SkillEntity, {
          name,
        });
        await manager.save(skill);
      }
      skills.push(skill);
    }
    return skills;
  }
}
