const prisma = require('../prisma');
const { checkAndSendRenewalReminders } = require('../services/reminderService');

const getAdminStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalProviders,
      totalStudents,
      totalAmenities,
      pendingAmenities,
      approvedAmenities,
      activeSubscriptions,
      allPayments,
      totalReviews
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'SERVICE_PROVIDER' } }),
      prisma.user.count({ where: { role: 'STUDENT_PROFESSIONAL' } }),
      prisma.amenity.count(),
      prisma.amenity.count({ where: { approvalStatus: 'PENDING' } }),
      prisma.amenity.count({ where: { approvalStatus: 'APPROVED' } }),
      prisma.subscription.count({ where: { status: 'ACTIVE' } }),
      prisma.payment.findMany({
        where: { paymentStatus: 'SUCCESS' },
        select: { amount: true, createdAt: true }
      }),
      prisma.review.count()
    ]);

    const totalGMV = allPayments.reduce((sum, p) => sum + p.amount, 0);

    // Recent 5 platform transactions
    const recentPayments = await prisma.payment.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, email: true } },
        subscription: {
          include: {
            amenity: { select: { name: true, category: true } }
          }
        }
      }
    });

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalProviders,
        totalStudents,
        totalAmenities,
        pendingAmenities,
        approvedAmenities,
        activeSubscriptions,
        totalGMV,
        totalReviews,
        recentPayments
      }
    });
  } catch (error) {
    next(error);
  }
};

const getAllAmenities = async (req, res, next) => {
  try {
    const { status } = req.query;

    const where = {};
    if (status && status !== 'ALL') {
      where.approvalStatus = status;
    }

    const amenities = await prisma.amenity.findMany({
      where,
      include: {
        provider: {
          select: { id: true, name: true, email: true, phone: true }
        },
        images: { take: 1 },
        subscriptionPlans: true,
        _count: {
          select: { subscriptions: true, reviews: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      amenities
    });
  } catch (error) {
    next(error);
  }
};

const updateListingApproval = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;

    if (!['APPROVED', 'REJECTED', 'PENDING'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const amenity = await prisma.amenity.findUnique({
      where: { id }
    });

    if (!amenity) {
      return res.status(404).json({ message: 'Amenity not found.' });
    }

    const updated = await prisma.amenity.update({
      where: { id },
      data: { approvalStatus: status }
    });

    // Notify provider
    await prisma.notification.create({
      data: {
        userId: amenity.providerId,
        title: `Listing ${status}: ${amenity.name}`,
        message: remarks
          ? `Your amenity listing "${amenity.name}" was ${status.toLowerCase()}. Note: ${remarks}`
          : `Your amenity listing "${amenity.name}" was ${status.toLowerCase()} by platform admin.`,
        type: `LISTING_${status}`
      }
    });

    res.json({
      success: true,
      message: `Listing has been marked as ${status}.`,
      amenity: updated
    });
  } catch (error) {
    next(error);
  }
};

const getAllUsers = async (req, res, next) => {
  try {
    const { role, search } = req.query;

    const where = {};
    if (role && role !== 'ALL') {
      where.role = role;
    }

    if (search && search.trim()) {
      where.OR = [
        { name: { contains: search.trim(), mode: 'insensitive' } },
        { email: { contains: search.trim(), mode: 'insensitive' } }
      ];
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        avatar: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            amenities: true,
            subscriptions: true,
            reviews: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      users
    });
  } catch (error) {
    next(error);
  }
};

const toggleUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (id === req.user.id) {
      return res.status(400).json({ message: 'Cannot deactivate your own admin account.' });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive }
    });

    res.json({
      success: true,
      message: `User account is now ${updated.isActive ? 'Active' : 'Suspended'}.`,
      user: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        isActive: updated.isActive
      }
    });
  } catch (error) {
    next(error);
  }
};

const getAllReviews = async (req, res, next) => {
  try {
    const reviews = await prisma.review.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true } },
        amenity: { select: { id: true, name: true, category: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      reviews
    });
  } catch (error) {
    next(error);
  }
};

const deleteReview = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.review.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Review removed successfully by moderator.'
    });
  } catch (error) {
    next(error);
  }
};

const triggerRenewalJob = async (req, res, next) => {
  try {
    const result = await checkAndSendRenewalReminders();
    res.json({
      success: true,
      message: 'Renewal reminder check completed.',
      result
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAdminStats,
  getAllAmenities,
  updateListingApproval,
  getAllUsers,
  toggleUserStatus,
  getAllReviews,
  deleteReview,
  triggerRenewalJob
};
