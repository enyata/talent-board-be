import { UserEntity } from "@src/entities/user.entity";
import { instanceToPlain } from "class-transformer";
import { resolveAssetUrl } from "./resolveAssetUrl";

export const sanitizeUser = (user: UserEntity): Record<string, any> => {
  const plainUser = instanceToPlain(user, {
    strategy: "excludeAll",
    exposeUnsetFields: false,
  });

  if (plainUser.avatar) {
    plainUser.avatar = resolveAssetUrl(plainUser.avatar);
  }

  const roleProfileMap: Record<string, any | undefined> = {
    talent: user.talent_profile,
    recruiter: user.recruiter_profile,
  };

  const rawProfile = roleProfileMap[user.role ?? ""];

  const plainProfile = rawProfile
    ? instanceToPlain(rawProfile, {
        strategy: "excludeAll",
        exposeUnsetFields: false,
      })
    : undefined;

  if (plainProfile && user.role === "talent") {
    if (plainProfile.resume_path) {
      plainProfile.resume_path = resolveAssetUrl(plainProfile.resume_path);
    }
    if (plainProfile.portfolio_url) {
      plainProfile.portfolio_url = resolveAssetUrl(plainProfile.portfolio_url);
    }
  }

  return {
    ...plainUser,
    profile: plainProfile,
  };
};
