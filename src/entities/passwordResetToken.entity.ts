import { IsDate, IsEmail, IsOptional, IsString } from "class-validator";
import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import ExtendedBaseEntity from "./base.entity";
import { UserEntity } from "./user.entity";

@Entity({ name: "password_reset_tokens" })
export class PasswordResetTokenEntity extends ExtendedBaseEntity {
  @ManyToOne(() => UserEntity, (u) => u.id, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: UserEntity;

  @IsEmail()
  @IsString()
  @Column()
  email: string;

  // Store the hashed token for security
  @IsString()
  @Column()
  token: string;

  @IsDate()
  @Column({ type: "timestamp" })
  expires_at: Date;

  // Timestamp when the token was used (null if not used)
  @IsOptional()
  @IsDate()
  @Column({ type: "timestamp", nullable: true })
  used_at: Date | null;
}
