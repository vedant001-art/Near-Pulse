const prisma = require('../prisma');

const getDashboardStats = async (req, res, next) => {
  try {
    const providerId = req.user.id;

    // Get all amenity IDs belonging to this provider
    const amenities = await prisma.amenity.findMany({
      where: { providerId },
      include: {
        reviews: { select: { rating: true } },
        subscriptions: {
          where: { status: 'ACTIVE' },
          select: { id: true }
        }
      }
    });

    const amenityIds = amenities.map((a) => a.id);

    // Count active subscribers
    const activeSubscribersCount = amenities.reduce(
      (sum, a) => sum + a.subscriptions.length,
      0
    );

    // Sum revenue from payments for this provider's amenities
    const payments = await prisma.payment.findMany({
      where: {
        paymentStatus: 'SUCCESS',
        subscription: {
          amenityId: { in: amenityIds }
        }
      },
      select: { amount: true }
    });

    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);

    // Calculate overall average rating from actual reviews
    const allRatings = amenities.flatMap((a) => a.reviews.map((r) => r.rating));
    const averageRating = allRatings.length > 0
      ? Number((allRatings.reduce((sum, r) => sum + r, 0) / allRatings.length).toFixed(1))
      : 0;

    res.json({
      success: true,
      stats: {
        totalListings: amenities.length,
        activeSubscribersCount,
        totalRevenue,
        totalReviews: allRatings.length,
        averageRating
      }
    });
  } catch (error) {
    next(error);
  }
};

const getProviderListings = async (req, res, next) => {
  try {
    const providerId = req.user.id;

    const listings = await prisma.amenity.findMany({
      where: { providerId },
      include: {
        images: true,
        subscriptionPlans: true,
        _count: {
          select: {
            subscriptions: { where: { status: 'ACTIVE' } },
            reviews: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      listings
    });
  } catch (error) {
    next(error);
  }
};

const getProviderSubscriptions = async (req, res, next) => {
  try {
    const providerId = req.user.id;

    const subscriptions = await prisma.subscription.findMany({
      where: {
        amenity: { providerId }
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true, avatar: true }
        },
        amenity: {
          select: { id: true, name: true, category: true }
        },
        plan: true,
        payments: {
          where: { paymentStatus: 'SUCCESS' },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      subscriptions
    });
  } catch (error) {
    next(error);
  }
};

const getProviderPayments = async (req, res, next) => {
  try {
    const providerId = req.user.id;

    const payments = await prisma.payment.findMany({
      where: {
        subscription: {
          amenity: { providerId }
        }
      },
      include: {
        user: {
          select: { name: true, email: true }
        },
        subscription: {
          include: {
            amenity: { select: { name: true } },
            plan: { select: { name: true } }
          }
        }
      },
      orderBy: { paymentDate: 'desc' }
    });

    res.json({
      success: true,
      payments
    });
  } catch (error) {
    next(error);
  }
};

const toggleListingAvailability = async (req, res, next) => {
  try {
    const { id } = req.params;
    const providerId = req.user.id;

    const amenity = await prisma.amenity.findUnique({ where: { id } });
    if (!amenity) {
      return res.status(404).json({ message: 'Listing not found.' });
    }

    if (req.user.role !== 'ADMIN' && amenity.providerId !== providerId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const updated = await prisma.amenity.update({
      where: { id },
      data: { isAvailable: !amenity.isAvailable }
    });

    res.json({
      success: true,
      message: `Listing availability set to: ${updated.isAvailable ? 'Available' : 'Unavailable (Full)'}`,
      isAvailable: updated.isAvailable
    });
  } catch (error) {
    next(error);
  }
};

const addPlanToAmenity = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, durationDays, price, features, isPopular } = req.body;
    const providerId = req.user.id;

    const amenity = await prisma.amenity.findUnique({ where: { id } });
    if (!amenity) return res.status(404).json({ message: 'Listing not found.' });
    if (req.user.role !== 'ADMIN' && amenity.providerId !== providerId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const featureList = Array.isArray(features)
      ? features
      : (typeof features === 'string' ? features.split(',').map((s) => s.trim()).filter(Boolean) : []);

    const plan = await prisma.subscriptionPlan.create({
      data: {
        amenityId: id,
        name: name.trim(),
        durationDays: parseInt(durationDays, 10) || 30,
        price: parseFloat(price),
        features: featureList,
        isPopular: Boolean(isPopular)
      }
    });

    res.status(201).json({
      success: true,
      message: 'Subscription plan added successfully!',
      plan
    });
  } catch (error) {
    next(error);
  }
};

const deletePlanFromAmenity = async (req, res, next) => {
  try {
    const { planId } = req.params;
    const providerId = req.user.id;

    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId },
      include: { amenity: true }
    });

    if (!plan) return res.status(404).json({ message: 'Subscription plan not found.' });
    if (req.user.role !== 'ADMIN' && plan.amenity.providerId !== providerId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    await prisma.subscriptionPlan.delete({ where: { id: planId } });

    res.json({
      success: true,
      message: 'Subscription plan removed.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getProviderListings,
  getProviderSubscriptions,
  getProviderPayments,
  toggleListingAvailability,
  addPlanToAmenity,
  deletePlanFromAmenity
};
