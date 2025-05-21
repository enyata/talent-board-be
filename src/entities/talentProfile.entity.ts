import { Expose } from "class-transformer";
import { IsArray, IsEnum, IsOptional, IsString, IsUrl } from "class-validator";
import { Column, Entity, JoinColumn, OneToOne } from "typeorm";
import ExtendedBaseEntity from "./base.entity";
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

  @Column("text", { array: true })
  @Expose()
  @IsArray()
  @IsString({ each: true })
  skills: string[];

  @Column({ type: "enum", enum: ExperienceLevel })
  @Expose()
  @IsEnum(ExperienceLevel)
  experience_level: ExperienceLevel;

  @Column({ type: "enum", enum: ProfileStatus, default: ProfileStatus.PENDING })
  @Expose()
  @IsEnum(ProfileStatus)
  profile_status: ProfileStatus;

  @Column({ select: false })
  skills_text?: string;
}
