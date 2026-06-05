import { Expose } from "class-transformer";
import { IsString, Length } from "class-validator";
import { Column, Entity } from "typeorm";
import ExtendedBaseEntity from "./base.entity";

@Entity({ name: "skills" })
export class SkillEntity extends ExtendedBaseEntity {
  @Column({ unique: true })
  @Expose()
  @IsString()
  @Length(1, 100)
  name: string;
}
