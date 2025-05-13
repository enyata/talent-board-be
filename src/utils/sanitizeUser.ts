import { UserEntity } from "@src/entities/user.entity";
import { instanceToPlain } from "class-transformer";

export const sanitizeUser = (user: UserEntity): Record<string, any> => {
  const plainUser = instanceToPlain(user, {
    strategy: "excludeAll",
    exposeUnsetFields: false,
  });

  const roleProfileMap: Record<string, any> = {
    talent: user.talent_profile,
    recruiter: user.recruiter_profile,
  };

  return {
    ...plainUser,
    profile: user.role ? instanceToPlain(roleProfileMap[user.role]) : undefined,
  };
};
