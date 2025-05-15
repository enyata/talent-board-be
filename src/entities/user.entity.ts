import { Expose } from "class-transformer";
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  Length,
} from "class-validator";
import { Column, Entity, OneToMany, OneToOne } from "typeorm";
import ExtendedBaseEntity from "./base.entity";
import { NotificationEntity } from "./notification.entity";
import { RecruiterProfileEntity } from "./recruiterProfile.entity";
import { RefreshToken } from "./refreshToken.entity";
import { TalentProfileEntity } from "./talentProfile.entity";

export enum UserProvider {
  GOOGLE = "google",
  LINKEDIN = "linkedin",
}

export enum UserRole {
  TALENT = "talent",
  RECRUITER = "recruiter",
}

@Entity({ name: "users" })
export class UserEntity extends ExtendedBaseEntity {
  @Column()
  @Expose()
  @IsString()
  @Length(1, 50)
  first_name: string;

  @Column()
  @Expose()
  @IsString()
  @Length(1, 50)
  last_name: string;

  @Column({ unique: true })
  @Expose()
  @IsEmail()
  email: string;

  @Column({ nullable: true })
  @Expose()
  @IsOptional()
  @IsUrl()
  avatar: string;

  @Column({ type: "enum", enum: UserProvider })
  @Expose()
  @IsEnum(UserProvider)
  provider: UserProvider;

  @Column({ type: "enum", enum: UserRole, nullable: true })
  @Expose()
  @IsOptional()
  @IsEnum(UserRole)
  role: UserRole;

  @Column({ default: false })
  @Expose()
  @IsBoolean()
  profile_completed: boolean;

  @Column({ nullable: true })
  @Expose()
  @IsOptional()
  @IsString()
  state: string;

  @Column({ nullable: true })
  @Expose()
  @IsOptional()
  @IsString()
  country: string;

  @Column({ nullable: true })
  @Expose()
  @IsOptional()
  @IsUrl()
  linkedin_profile: string;

  @OneToMany(() => RefreshToken, (refresh) => refresh.user)
  refresh_tokens: RefreshToken[];

  @OneToOne(() => TalentProfileEntity, (tp) => tp.user, { cascade: true })
  talent_profile: TalentProfileEntity;

  @OneToOne(() => RecruiterProfileEntity, (rp) => rp.user, { cascade: true })
  recruiter_profile: RecruiterProfileEntity;

  @OneToMany(
    () => NotificationEntity,
    (notification) => notification.recipient,
    { cascade: true },
  )
  @Expose()
  received_notifications: NotificationEntity[];
}
