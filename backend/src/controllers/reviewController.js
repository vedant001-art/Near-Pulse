const prisma = require('../prisma');

const getAmenityReviews = async (req, res, next) => {
  try {
    const { id } = req.params;

    const reviews = await prisma.review.findMany({
      where: { amenityId: id },
      include: {
        user: {
          select: { id: true, name: true, avatar: true }
        }
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

const createReview = async (req, res, next) => {
  try {
    const { id: amenityId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.id;

    if (!rating || !comment) {
      return res.status(400).json({ message: 'Rating and comment are required.' });
    }

    const ratingNum = parseInt(rating, 10);
    if (ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5 stars.' });
    }

    const amenity = await prisma.amenity.findUnique({
      where: { id: amenityId }
    });

    if (!amenity) {
      return res.status(404).json({ message: 'Amenity not found.' });
    }

    const review = await prisma.review.create({
      data: {
        userId,
        amenityId,
        rating: ratingNum,
        comment: comment.trim()
      },
      include: {
        user: {
          select: { id: true, name: true, avatar: true }
        }
      }
    });

    // Notify provider
    await prisma.notification.create({
      data: {
        userId: amenity.providerId,
        title: 'New Customer Review Received',
        message: `${req.user.name} rated your amenity "${amenity.name}" with ${ratingNum} stars.`,
        type: 'NEW_REVIEW'
      }
    });

    res.status(201).json({
      success: true,
      message: 'Thank you! Your review has been published.',
      review
    });
  } catch (error) {
    next(error);
  }
};

const replyToReview = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const { reply } = req.body;

    if (!reply || !reply.trim()) {
      return res.status(400).json({ message: 'Reply content cannot be empty.' });
    }

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: { amenity: true }
    });

    if (!review) {
      return res.status(404).json({ message: 'Review not found.' });
    }

    if (req.user.role !== 'ADMIN' && review.amenity.providerId !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden. You do not own this listing.' });
    }

    const updated = await prisma.review.update({
      where: { id: reviewId },
      data: { providerReply: reply.trim() }
    });

    res.json({
      success: true,
      message: 'Reply posted successfully.',
      review: updated
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAmenityReviews,
  createReview,
  replyToReview
};
