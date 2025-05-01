import { Expose } from "class-transformer";
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

@Entity({ name: "users" })
export class UserEntity extends ExtendedBaseEntity {
  @Column({ name: "first_name" })
  @Expose()
  first_name: string;

  @Column({ name: "last_name" })
  @Expose()
  last_name: string;

  @Column({ name: "email", unique: true })
  @Expose()
  email: string;

  @Column({ name: "avatar", nullable: true })
  @Expose()
  avatar: string;

  @Column({
    name: "provider",
    type: "enum",
    enum: UserProvider,
  })
  @Expose()
  provider: UserProvider;

  @Column({
    name: "role",
    type: "enum",
    enum: UserRole,
    nullable: true,
  })
  @Expose()
  role: UserRole;

  @Column({ name: "profile_completed", default: false })
  @Expose()
  profile_completed: boolean;

  @OneToMany(() => RefreshToken, (refresh) => refresh.user)
  refresh_tokens: RefreshToken[];
}
