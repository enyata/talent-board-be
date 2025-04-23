import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import ExtendedBaseEntity from "./base.entity";
import { UserEntity } from "./user.entity";

@Entity({ name: "refresh_tokens" })
export class RefreshToken extends ExtendedBaseEntity {
  @Column({ nullable: false })
  token: string;

  @Column({ name: "is_valid", type: "boolean", default: true })
  is_valid: boolean;

  @ManyToOne(() => UserEntity, (user) => user.refreshTokens, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "user_id" })
  user: UserEntity;
}
