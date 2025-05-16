import { Column, Entity, JoinColumn, ManyToOne, Unique } from "typeorm";
import ExtendedBaseEntity from "./base.entity";
import { UserEntity } from "./user.entity";

@Entity("saved_talents")
@Unique(["recruiter", "talent"])
export class SavedTalentEntity extends ExtendedBaseEntity {
  @ManyToOne(() => UserEntity, { eager: true })
  @JoinColumn({ name: "recruiter_id" })
  recruiter: UserEntity;

  @ManyToOne(() => UserEntity, { eager: false })
  @JoinColumn({ name: "talent_id" })
  talent: UserEntity;

  @Column()
  saved_at: Date;
}
