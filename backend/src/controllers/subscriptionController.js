const prisma = require('../prisma');
const { createPaymentOrder, KEY_ID } = require('../services/paymentService');

const createSubscription = async (req, res, next) => {
  try {
    const { amenityId, planId, startDate, autoRenewal = false } = req.body;
    const userId = req.user.id;

    if (!amenityId || !planId) {
      return res.status(400).json({ message: 'Amenity ID and Plan ID are required.' });
    }

    const [amenity, plan] = await Promise.all([
      prisma.amenity.findUnique({ where: { id: amenityId } }),
      prisma.subscriptionPlan.findUnique({ where: { id: planId } })
    ]);

    if (!amenity) {
      return res.status(404).json({ message: 'Amenity not found.' });
    }

    if (!plan || plan.amenityId !== amenityId) {
      return res.status(400).json({ message: 'Selected plan does not belong to this amenity.' });
    }

    const start = startDate ? new Date(startDate) : new Date();
    const expiry = new Date(start.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

    // Calculate price breakdown: base price + 18% GST (or included depending on business model)
    const basePrice = plan.price;
    const platformFee = 49;
    const gst = Math.round(basePrice * 0.05); // 5% GST on essentials
    const totalAmount = basePrice + platformFee + gst;

    // Create pending subscription
    const subscription = await prisma.subscription.create({
      data: {
        userId,
        amenityId,
        planId,
        startDate: start,
        expiryDate: expiry,
        status: 'PENDING_PAYMENT',
        autoRenewal: Boolean(autoRenewal),
        reminderSent: false
      },
      include: {
        amenity: true,
        plan: true
      }
    });

    // Create payment gateway order
    const orderReceipt = `sub_${subscription.id.slice(0, 8)}`;
    const gatewayOrder = await createPaymentOrder({
      amount: totalAmount,
      currency: 'INR',
      receipt: orderReceipt,
      notes: {
        subscriptionId: subscription.id,
        userId,
        amenityName: amenity.name,
        planName: plan.name
      }
    });

    // Create initial pending payment record
    const payment = await prisma.payment.create({
      data: {
        subscriptionId: subscription.id,
        userId,
        amount: totalAmount,
        currency: 'INR',
        gatewayReference: gatewayOrder.id,
        paymentStatus: 'PENDING',
        paymentMethod: 'PENDING'
      }
    });

    res.status(201).json({
      success: true,
      subscriptionId: subscription.id,
      subscription,
      order: gatewayOrder,
      keyId: KEY_ID,
      paymentId: payment.id,
      pricing: {
        basePrice,
        platformFee,
        gst,
        totalAmount
      }
    });
  } catch (error) {
    next(error);
  }
};

const getUserSubscriptions = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const now = new Date();

    const subscriptions = await prisma.subscription.findMany({
      where: { userId },
      include: {
        amenity: {
          include: {
            images: { take: 1 },
            provider: {
              select: { name: true, phone: true, email: true }
            }
          }
        },
        plan: true,
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const enriched = subscriptions.map((sub) => {
      const start = new Date(sub.startDate);
      const expiry = new Date(sub.expiryDate);
      const totalDuration = Math.max(1, expiry.getTime() - start.getTime());
      const elapsed = Math.max(0, now.getTime() - start.getTime());
      const progressPercent = Math.min(100, Math.round((elapsed / totalDuration) * 100));

      const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const isExpiringSoon = sub.status === 'ACTIVE' && daysLeft >= 0 && daysLeft <= 7;

      return {
        ...sub,
        daysLeft: Math.max(0, daysLeft),
        progressPercent,
        isExpiringSoon,
        coverImage: sub.amenity.images[0]?.url || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800'
      };
    });

    res.json({
      success: true,
      subscriptions: enriched
    });
  } catch (error) {
    next(error);
  }
};

const getSubscriptionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const subscription = await prisma.subscription.findUnique({
      where: { id },
      include: {
        amenity: {
          include: {
            images: true,
            provider: {
              select: { name: true, phone: true, email: true }
            }
          }
        },
        plan: true,
        payments: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found.' });
    }

    if (req.user.role !== 'ADMIN' && subscription.userId !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden. This subscription belongs to another user.' });
    }

    res.json({
      success: true,
      subscription
    });
  } catch (error) {
    next(error);
  }
};

const cancelSubscription = async (req, res, next) => {
  try {
    const { id } = req.params;
    const subscription = await prisma.subscription.findUnique({
      where: { id },
      include: { amenity: true }
    });

    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found.' });
    }

    if (req.user.role !== 'ADMIN' && subscription.userId !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    if (subscription.status === 'CANCELLED') {
      return res.status(400).json({ message: 'Subscription is already cancelled.' });
    }

    const updated = await prisma.subscription.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        autoRenewal: false
      }
    });

    // Notify user
    await prisma.notification.create({
      data: {
        userId: subscription.userId,
        title: 'Subscription Cancelled',
        message: `Your subscription to "${subscription.amenity.name}" was cancelled. Services will terminate on ${new Date(subscription.expiryDate).toLocaleDateString()}.`,
        type: 'SUBSCRIPTION_CANCELLED'
      }
    });

    res.json({
      success: true,
      message: 'Subscription has been cancelled.',
      subscription: updated
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createSubscription,
  getUserSubscriptions,
  getSubscriptionById,
  cancelSubscription
};
