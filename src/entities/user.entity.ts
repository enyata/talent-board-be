import { Expose } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  Length,
} from "class-validator";
import { Column, Entity, OneToMany } from "typeorm";
import ExtendedBaseEntity from "./base.entity";
import { RefreshToken } from "./refreshToken.entity";

export enum UserProvider {
  GOOGLE = "google",
  LINKEDIN = "linkedin",
}

export enum UserRole {
  TALENT = "talent",
  RECRUITER = "recruiter",
}

export enum ExperienceLevel {
  ENTRY = "entry",
  INTERMEDIATE = "intermediate",
  EXPERT = "expert",
}

@Entity({ name: "users" })
export class UserEntity extends ExtendedBaseEntity {
  @Column({ name: "first_name" })
  @Expose()
  @IsString()
  @Length(1, 50)
  first_name: string;

  @Column({ name: "last_name" })
  @Expose()
  @IsString()
  @Length(1, 50)
  last_name: string;

  @Column({ name: "email", unique: true })
  @Expose()
  @IsEmail()
  email: string;

  @Column({ name: "avatar", nullable: true })
  @Expose()
  @IsOptional()
  @IsUrl()
  avatar: string;

  @Column({
    name: "provider",
    type: "enum",
    enum: UserProvider,
  })
  @Expose()
  @IsEnum(UserProvider)
  provider: UserProvider;

  @Column({
    name: "role",
    type: "enum",
    enum: UserRole,
    nullable: true,
  })
  @Expose()
  @IsOptional()
  @IsEnum(UserRole)
  role: UserRole;

  @Column({ name: "profile_completed", default: false })
  @Expose()
  @IsBoolean()
  profile_completed: boolean;

  @Column({ name: "location", nullable: true })
  @Expose({ groups: ["talent", "recruiter"] })
  @IsOptional()
  @IsString()
  location: string;

  @Column({ name: "portfolio_url", nullable: true })
  @Expose({ groups: ["talent"] })
  @IsOptional()
  @IsUrl()
  portfolio_url: string;

  @Column({ name: "linkedin_profile", nullable: true })
  @Expose({ groups: ["talent", "recruiter"] })
  @IsOptional()
  @IsUrl()
  linkedin_profile: string;

  @Column({ name: "resume_path", nullable: true })
  @Expose({ groups: ["talent"] })
  @IsOptional()
  @IsString()
  resume_path: string;

  @Column("text", { name: "skills", nullable: true, array: true })
  @Expose({ groups: ["talent"] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills: string[];

  @Column({
    name: "experience_level",
    type: "enum",
    enum: ExperienceLevel,
    nullable: true,
  })
  @Expose({ groups: ["talent"] })
  @IsOptional()
  @IsEnum(ExperienceLevel)
  experience_level: ExperienceLevel;

  @Column({ name: "work_email", nullable: true })
  @Expose({ groups: ["recruiter"] })
  @IsOptional()
  @IsEmail()
  work_email: string;

  @Column({ name: "company_industry", nullable: true })
  @Expose({ groups: ["recruiter"] })
  @IsOptional()
  @IsString()
  company_industry: string;

  @Column("text", { name: "roles_looking_for", nullable: true, array: true })
  @Expose({ groups: ["recruiter"] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  roles_looking_for: string[];

  @OneToMany(() => RefreshToken, (refresh) => refresh.user)
  refresh_tokens: RefreshToken[];
}
