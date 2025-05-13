import { Expose } from "class-transformer";
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
} from "class-validator";
import { Column, Entity, JoinColumn, OneToOne } from "typeorm";
import ExtendedBaseEntity from "./base.entity";
import { UserEntity } from "./user.entity";

export enum HiringFor {
  MYSELF = "myself",
  COMPANY = "my company",
}

@Entity({ name: "recruiter_profiles" })
export class RecruiterProfileEntity extends ExtendedBaseEntity {
  @OneToOne(() => UserEntity, (user) => user.recruiter_profile)
  @JoinColumn({ name: "user_id" })
  user: UserEntity;

  @Column({ nullable: true })
  @Expose()
  @IsOptional()
  @IsString()
  resume_path: string;

  @Column()
  @Expose()
  @IsEmail()
  work_email: string;

  @Column()
  @Expose()
  @IsString()
  company_industry: string;

  @Column("text", { array: true })
  @Expose()
  @IsArray()
  @IsString({ each: true })
  roles_looking_for: string[];

  @Column({ type: "enum", enum: HiringFor })
  @Expose()
  @IsEnum(HiringFor)
  hiring_for: HiringFor;
}
