import { Exclude, Expose } from "class-transformer";
import { validateOrReject } from "class-validator";
import {
  BaseEntity,
  BeforeInsert,
  BeforeUpdate,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity()
export class ExtendedBaseEntity extends BaseEntity {
  @BeforeInsert()
  async validateOnInsert() {
    if (process.env.NODE_ENV !== "test") {
      await validateOrReject(this);
    }
  }

  @BeforeUpdate()
  async validateOnUpdate() {
    if (process.env.NODE_ENV !== "test") {
      await validateOrReject(this, { skipMissingProperties: true });
    }
  }

  @PrimaryGeneratedColumn("uuid")
  @Expose()
  id: string;

  @CreateDateColumn({ name: "created_at" })
  @Exclude()
  created_at: Date;

  @UpdateDateColumn({ name: "updated_at" })
  @Exclude()
  updated_at: Date;

  @DeleteDateColumn({ name: "deleted_at", nullable: true })
  @Exclude()
  deleted_at: Date;
}

export default ExtendedBaseEntity;
