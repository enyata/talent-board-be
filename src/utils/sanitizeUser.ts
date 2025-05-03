import { UserEntity } from "@src/entities/user.entity";
import { ClassTransformOptions, instanceToPlain } from "class-transformer";

export const sanitizeUser = (
  user: Partial<UserEntity>,
): Record<string, any> => {
  const group = user.role ?? undefined;

  const options: ClassTransformOptions = {
    strategy: "excludeAll",
    exposeUnsetFields: false,
    groups: group ? [group] : undefined,
  };

  return instanceToPlain(user, options);
};
