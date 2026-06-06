import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import ExtendedBaseEntity from "./base.entity";
import { UserEntity } from "./user.entity";

@Entity({ name: "email_otps" })
export class EmailOtpEntity extends ExtendedBaseEntity {
  @ManyToOne(() => UserEntity, (u) => u.id, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: UserEntity;

  @Column()
  email: string;

  @Column()
  otp: string;

  @Column({ type: "timestamp" })
  expires_at: Date;
}
