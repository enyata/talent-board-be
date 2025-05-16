import {
  NotificationEntity,
  NotificationType,
} from "@src/entities/notification.entity";
import { SavedTalentEntity } from "@src/entities/savedTalent.entity";
import { TalentProfileEntity } from "@src/entities/talentProfile.entity";

export const getProfileStatus = (profile: TalentProfileEntity): string => {
  return profile.profile_status;
};

export const generateNotificationMessage = (
  type: NotificationType,
  senderName: string,
): string => {
  switch (type) {
    case NotificationType.SAVE:
      return `${senderName} just saved your profile for future opportunities. 🤝`;
    case NotificationType.VIEW:
      return `${senderName} viewed your profile`;
    case NotificationType.UPVOTE:
      return `${senderName} just upvoted your profile. Keep shining! 👍`;
    case NotificationType.MESSAGE:
      return `You received a message from ${senderName}`;
    default:
      return `${senderName} interacted with your profile`;
  }
};

export const serializeSavedTalents = (saved: SavedTalentEntity[]) =>
  saved.map(({ saved_at, talent }) => {
    const profile = talent.talent_profile;
    return {
      saved_at,
      id: talent.id,
      first_name: talent.first_name,
      last_name: talent.last_name,
      avatar: talent.avatar,
      state: talent.state,
      country: talent.country,
      linkedin_profile: talent.linkedin_profile,
      portfolio_url: profile?.portfolio_url ?? null,
      skills: profile?.skills ?? [],
      experience_level: profile?.experience_level ?? null,
    };
  });

export const serializeRecommendedTalents = (profiles: TalentProfileEntity[]) =>
  profiles.map((profile) => ({
    id: profile.user.id,
    first_name: profile.user.first_name,
    last_name: profile.user.last_name,
    avatar: profile.user.avatar,
    state: profile.user.state,
    country: profile.user.country,
    linkedin_profile: profile.user.linkedin_profile,
    portfolio_url: profile.portfolio_url,
    skills: profile.skills,
    experience_level: profile.experience_level,
  }));

export const serializeNotifications = (notifications: NotificationEntity[]) =>
  notifications.map((notif) => ({
    id: notif.id,
    type: notif.type,
    message: notif.message,
    read: notif.read,
    timestamp: notif.created_at,
  }));
