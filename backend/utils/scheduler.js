const cron = require('node-cron');
const Meeting = require('../models/Meeting');
const Notification = require('../models/Notification');

// Check for meetings starting in the next 15 minutes
const checkUpcomingMeetings = async () => {
  try {
    const now = new Date();
    const fifteenMinutesLater = new Date(now.getTime() + 15 * 60000);

    // Find meetings starting within 15 minutes that haven't had a reminder sent
    const upcomingMeetings = await Meeting.find({
      startTime: { $gt: now, $lte: fifteenMinutesLater },
      status: 'scheduled',
      reminderSent: false
    });

    if (upcomingMeetings.length === 0) {
      return;
    }

    console.log(`scheduler: Found ${upcomingMeetings.length} upcoming meetings to notify.`);

    for (const meeting of upcomingMeetings) {
      // Create notifications for all attendees
      try {
        const notifications = meeting.attendees.map(attendee => ({
          recipient: attendee.user,
          sender: meeting.organizer, // Or a system ID if preferred
          type: 'meeting_reminder', // Ensure 'meeting_reminder' is handled in your frontend if specific logic is needed
          category: 'meeting',
          title: 'Meeting Reminder',
          message: `Meeting "${meeting.title}" starts in less than 15 minutes.`,
          project: meeting.project,
          meeting: meeting._id,
          priority: 'high',
          actionUrl: `/dashboard/projects/${meeting.project}?meetingId=${meeting._id}`,
          metadata: { meetingId: meeting._id }
        }));

        // Send notifications individually to use the createNotification logic which might trigger sockets?
        // Or bulk insert for performance. Since strict Notification model logic exists using createNotification is safer.
        // But for scheduler, let's iterate.
        for (const notifData of notifications) {
            await Notification.createNotification(notifData).catch(e => console.error("Failed to create notif:", e));
        }

        // Mark meeting as reminder sent
        meeting.reminderSent = true;
        await meeting.save();
        console.log(`scheduler: Sent reminders for meeting ${meeting._id}`);
      } catch (err) {
        console.error(`scheduler: Failed to process meeting ${meeting._id}`, err);
      }
    }
  } catch (error) {
    console.error('scheduler: Error checking upcoming meetings:', error);
  }
};

const initScheduler = () => {
  // Run every minute
  cron.schedule('* * * * *', () => {
    checkUpcomingMeetings();
  });
  console.log('Scheduler initialized: Checking for upcoming meetings every minute.');
};

module.exports = initScheduler;
