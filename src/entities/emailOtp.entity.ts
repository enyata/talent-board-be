import { IsDate, IsEmail, IsOptional, IsString } from "class-validator";
import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import ExtendedBaseEntity from "./base.entity";
import { UserEntity } from "./user.entity";

@Entity({ name: "email_otps" })
export class EmailOtpEntity extends ExtendedBaseEntity {
  @ManyToOne(() => UserEntity, (u) => u.id, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: UserEntity;

  @IsEmail()
  @IsString()
  @Column()
  email: string;

  @IsString()
  @Column()
  otp: string;

  @IsDate()
  @Column({ type: "timestamp" })
  expires_at: Date;

  @IsOptional()
  @IsDate()
  @Column({ type: "timestamp", nullable: true })
  used_at: Date | null;
}
