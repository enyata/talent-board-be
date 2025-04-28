import { ClassTransformOptions, plainToInstance } from "class-transformer";
import { UserEntity } from "../entities/user.entity";

export const sanitizeUser = (user: UserEntity): Partial<UserEntity> => {
  const options: ClassTransformOptions = { strategy: "excludeAll" };
  return plainToInstance(UserEntity, user, options);
};
