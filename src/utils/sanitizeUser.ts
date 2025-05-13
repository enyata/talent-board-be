import { UserEntity } from "@src/entities/user.entity";
import { instanceToPlain } from "class-transformer";

export const sanitizeUser = (user: UserEntity): Record<string, any> => {
  const plainUser = instanceToPlain(user, {
    strategy: "excludeAll",
    exposeUnsetFields: false,
  });

  const roleProfileMap: Record<string, any | undefined> = {
    talent: user.talent_profile,
    recruiter: user.recruiter_profile,
  };

  const rawProfile = roleProfileMap[user.role ?? ""];

  return {
    ...plainUser,
    profile: rawProfile
      ? instanceToPlain(rawProfile, {
          strategy: "excludeAll",
          exposeUnsetFields: false,
        })
      : undefined,
  };
};
