import { Exclude } from "class-transformer";
import {
  IsBoolean,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from "class-validator";
import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import ExtendedBaseEntity from "./base.entity";
import { UserEntity } from "./user.entity";

@Entity({ name: "refresh_tokens" })
export class RefreshToken extends ExtendedBaseEntity {
  @Column({ nullable: false })
  @IsString()
  @IsNotEmpty()
  token: string;

  @Column({ name: "is_valid", type: "boolean", default: true })
  @IsBoolean()
  is_valid: boolean;

  @Column({ name: "user_agent", nullable: true })
  @IsString()
  user_agent?: string;

  @Column({ name: "ip_address", nullable: true })
  @IsString()
  ip_address?: string;

  @Exclude()
  @ManyToOne(() => UserEntity, (user) => user.refresh_tokens, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "user_id" })
  @ValidateNested()
  user: UserEntity;
}
