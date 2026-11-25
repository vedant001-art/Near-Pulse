const cron = require('node-cron');
const prisma = require('../prisma');

/**
 * Checks for active subscriptions expiring within 7 days and sends renewal reminders
 */
async function checkAndSendRenewalReminders() {
  try {
    const now = new Date();
    const reminderWindow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days ahead

    // Find active subscriptions expiring soon that haven't received a reminder
    const expiringSubscriptions = await prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
        reminderSent: false,
        expiryDate: {
          gte: now,
          lte: reminderWindow
        }
      },
      include: {
        user: true,
        amenity: true,
        plan: true
      }
    });

    console.log(`[Renewal Service] Found ${expiringSubscriptions.length} subscriptions due for renewal reminder.`);

    const notificationsCreated = [];

    for (const sub of expiringSubscriptions) {
      const daysLeft = Math.ceil((new Date(sub.expiryDate) - now) / (1000 * 60 * 60 * 24));
      const formattedDate = new Date(sub.expiryDate).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });

      // 1. Create in-app notification
      const notification = await prisma.notification.create({
        data: {
          userId: sub.userId,
          title: `Renewal Alert: ${sub.amenity.name}`,
          message: `Your ${sub.plan.name} subscription will expire in ${daysLeft} day${daysLeft === 1 ? '' : 's'} on ${formattedDate}. Click to review or renew your plan.`,
          type: 'RENEWAL_REMINDER',
          isRead: false
        }
      });

      // 2. Mark reminder as sent to prevent duplicate reminders
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { reminderSent: true }
      });

      notificationsCreated.push({
        subscriptionId: sub.id,
        userEmail: sub.user.email,
        amenityName: sub.amenity.name,
        daysLeft,
        notificationId: notification.id
      });

      console.log(`[Renewal Service] Sent reminder to ${sub.user.email} for ${sub.amenity.name} (${daysLeft} days remaining).`);
    }

    // Also auto-expire any active subscriptions whose expiryDate has passed
    const expiredCount = await prisma.subscription.updateMany({
      where: {
        status: 'ACTIVE',
        expiryDate: { lt: now }
      },
      data: {
        status: 'EXPIRED'
      }
    });

    if (expiredCount.count > 0) {
      console.log(`[Renewal Service] Auto-expired ${expiredCount.count} past-due subscriptions.`);
    }

    return {
      success: true,
      remindersSent: notificationsCreated.length,
      details: notificationsCreated,
      expiredUpdated: expiredCount.count
    };
  } catch (error) {
    console.error('[Renewal Service] Error processing renewal reminders:', error);
    throw error;
  }
}

function initRenewalScheduler() {
  // Run once every day at 00:05 AM
  cron.schedule('5 0 * * *', async () => {
    console.log('[Renewal Service] Executing daily scheduled renewal check...');
    await checkAndSendRenewalReminders();
  });
  console.log('[Renewal Service] Cron scheduler initialized (daily at 00:05 AM).');
}

module.exports = {
  checkAndSendRenewalReminders,
  initRenewalScheduler
};
