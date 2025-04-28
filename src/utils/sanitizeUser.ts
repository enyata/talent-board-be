import { UserEntity } from "@/entities/user.entity";
import { ClassTransformOptions, plainToInstance } from "class-transformer";

export const sanitizeUser = (user: UserEntity): Partial<UserEntity> => {
  const options: ClassTransformOptions = { strategy: "excludeAll" };
  return plainToInstance(UserEntity, user, options);
};
