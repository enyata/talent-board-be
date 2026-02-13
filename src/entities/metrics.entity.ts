import { IsInt, Min } from "class-validator";
import { Column, Entity, JoinColumn, OneToOne } from "typeorm";
import ExtendedBaseEntity from "./base.entity";
import { UserEntity } from "./user.entity";

@Entity("user_metrics")
export class MetricsEntity extends ExtendedBaseEntity {
  @OneToOne(() => UserEntity)
  @JoinColumn({ name: "user_id" })
  user: UserEntity;

  @Column({ default: 0 })
  @IsInt()
  @Min(0)
  upvotes: number = 0;

  @Column({ default: 0 })
  @IsInt()
  @Min(0)
  profile_views: number = 0;

  @Column({ default: 0 })
  @IsInt()
  @Min(0)
  recruiter_saves: number = 0;

  @Column({ default: 0 })
  @IsInt()
  @Min(0)
  weekly_search_appearances: number = 0;
}
