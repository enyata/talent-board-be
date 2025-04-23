import { Expose } from "class-transformer";
import { Column, Entity, OneToMany } from "typeorm";
import ExtendedBaseEntity from "./base.entity";
import { RefreshToken } from "./refreshToken.entity";

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
    enum: ["google", "linkedin"],
  })
  @Expose()
  provider: "google" | "linkedin";

  @Column({
    name: "role",
    type: "enum",
    enum: ["talent", "recruiter"],
    nullable: true,
  })
  @Expose()
  role: "talent" | "recruiter";

  @Column({ name: "profile_completed", default: false })
  @Expose()
  profile_completed: boolean;

  @OneToMany(() => RefreshToken, (refresh) => refresh.user)
  refreshTokens: RefreshToken[];
}
