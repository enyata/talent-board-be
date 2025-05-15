import { NotificationType } from "@src/entities/notification.entity";
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
