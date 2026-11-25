const prisma = require('../prisma');
const { verifyPaymentSignature, createPaymentOrder, KEY_ID } = require('../services/paymentService');

const verifyPayment = async (req, res, next) => {
  try {
    const {
      subscriptionId,
      orderId,
      paymentId,
      signature,
      paymentMethod = 'UPI / Online'
    } = req.body;

    if (!subscriptionId || !orderId || !paymentId) {
      return res.status(400).json({ message: 'Missing required payment verification parameters.' });
    }

    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        amenity: true,
        plan: true,
        user: true
      }
    });

    if (!subscription) {
      return res.status(404).json({ message: 'Subscription record not found.' });
    }

    // Verify cryptographic signature or demo token securely on server
    const isValid = verifyPaymentSignature({
      orderId,
      paymentId,
      signature: signature || `sig_demo_${paymentId}`
    });

    if (!isValid) {
      // Mark as payment failed
      await prisma.subscription.update({
        where: { id: subscriptionId },
        data: { status: 'PAYMENT_FAILED' }
      });

      await prisma.payment.updateMany({
        where: { subscriptionId, gatewayReference: orderId },
        data: { paymentStatus: 'FAILED' }
      });

      return res.status(400).json({
        success: false,
        message: 'Payment verification failed. Invalid signature or credentials.'
      });
    }

    // Server calculates and sets true active dates
    const now = new Date();
    const expiry = new Date(now.getTime() + subscription.plan.durationDays * 24 * 60 * 60 * 1000);

    // Atomically update subscription and payment record
    const [updatedSubscription, updatedPayment] = await prisma.$transaction([
      prisma.subscription.update({
        where: { id: subscriptionId },
        data: {
          status: 'ACTIVE',
          startDate: now,
          expiryDate: expiry,
          reminderSent: false
        },
        include: {
          amenity: true,
          plan: true
        }
      }),
      prisma.payment.updateMany({
        where: { subscriptionId, gatewayReference: orderId },
        data: {
          razorpayPaymentId: paymentId,
          razorpaySignature: signature || `sig_demo_${paymentId}`,
          paymentStatus: 'SUCCESS',
          paymentMethod,
          paymentDate: now
        }
      })
    ]);

    // Send confirmation notification
    await prisma.notification.create({
      data: {
        userId: subscription.userId,
        title: 'Payment Successful! 🎉',
        message: `Your subscription to "${subscription.amenity.name}" (${subscription.plan.name}) is now ACTIVE until ${expiry.toLocaleDateString()}.`,
        type: 'PAYMENT_SUCCESS'
      }
    });

    res.json({
      success: true,
      message: 'Payment verified successfully. Subscription is now active!',
      subscription: updatedSubscription,
      paymentId,
      orderId
    });
  } catch (error) {
    next(error);
  }
};

const getUserPayments = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const payments = await prisma.payment.findMany({
      where: { userId },
      include: {
        subscription: {
          include: {
            amenity: {
              select: { id: true, name: true, category: true, locality: true }
            },
            plan: {
              select: { name: true, durationDays: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      payments
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  verifyPayment,
  getUserPayments
};
