export const getInitialIncompleteSignupReminderDate = (): Date => {
  // Schedule the first reminder for 1 day after the user signs up
  const next = new Date();
  next.setDate(next.getDate() + 1);
  return next;
};

// Schedule the next reminder based on the number of reminders already sent
export const getNextIncompleteSignupReminderDate = (
  reminderCount: number,
  from: Date = new Date(),
): Date => {
  const next = new Date(from);

  // If the reminder count is 0 or 1, schedule the next reminder in 3 days
  if (reminderCount <= 1) {
    next.setDate(next.getDate() + 3);
    return next;
  }

  // If the reminder count is 2, schedule the next reminder in 7 days
  if (reminderCount === 2) {
    next.setDate(next.getDate() + 7);
    return next;
  }

  // If the reminder count is 3 or more, schedule the next reminder in 30 days
  next.setDate(next.getDate() + 30);
  return next;
};
