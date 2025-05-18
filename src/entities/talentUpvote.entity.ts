import ExtendedBaseEntity from "@src/entities/base.entity";
import { UserEntity } from "@src/entities/user.entity";
import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  Unique,
} from "typeorm";

@Entity("talent_upvotes")
@Unique("UQ_recruiter_talent", ["recruiter", "talent"])
export class TalentUpvoteEntity extends ExtendedBaseEntity {
  @ManyToOne(() => UserEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "recruiter_id" })
  recruiter: UserEntity;

  @ManyToOne(() => UserEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "talent_id" })
  talent: UserEntity;

  @CreateDateColumn()
  upvoted_at: Date;
}
