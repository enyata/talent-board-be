import { Expose } from "class-transformer";
import { IsEnum, IsOptional, IsString, IsUrl } from "class-validator";
import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  OneToOne,
} from "typeorm";

import ExtendedBaseEntity from "./base.entity";
import { SkillEntity } from "./skill.entity";
import { UserEntity } from "./user.entity";

export enum ExperienceLevel {
  ENTRY = "entry",
  INTERMEDIATE = "intermediate",
  EXPERT = "expert",
}

export enum ProfileStatus {
  PENDING = "pending",
  UNDER_REVIEW = "under_review",
  APPROVED = "approved",
  REJECTED = "rejected",
}

@Entity({ name: "talent_profiles" })
export class TalentProfileEntity extends ExtendedBaseEntity {
  @OneToOne(() => UserEntity, (user) => user.talent_profile)
  @JoinColumn({ name: "user_id" })
  user: UserEntity;

  @Column()
  @Expose()
  @IsString()
  resume_path: string;

  @Column({ nullable: true })
  @Expose()
  @IsOptional()
  @IsUrl()
  portfolio_url: string;

  @Column({ type: "text", nullable: true })
  @Expose()
  @IsOptional()
  @IsString()
  bio?: string;

  @Column({ type: "varchar" })
  @Expose()
  @IsString()
  job_title: string;

  @ManyToMany(() => SkillEntity)
  @JoinTable({
    name: "talent_skills",
    joinColumn: {
      name: "talent_profile_id",
      referencedColumnName: "id",
    },
    inverseJoinColumn: {
      name: "skill_id",
      referencedColumnName: "id",
    },
  })
  @Expose()
  skills: SkillEntity[];

  @Column({ type: "enum", enum: ExperienceLevel })
  @Expose()
  @IsEnum(ExperienceLevel)
  experience_level: ExperienceLevel;

  @Column({ type: "enum", enum: ProfileStatus, default: ProfileStatus.PENDING })
  @Expose()
  @IsEnum(ProfileStatus)
  profile_status: ProfileStatus;
}
