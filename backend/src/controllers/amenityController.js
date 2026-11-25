const prisma = require('../prisma');

// Haversine formula to compute distance in km between two GPS coordinates
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
}

const getAmenities = async (req, res, next) => {
  try {
    const {
      search,
      category,
      locality,
      city,
      minPrice,
      maxPrice,
      minRating,
      isAvailable,
      userLat,
      userLng,
      maxDistance,
      sortBy = 'rating_desc'
    } = req.query;

    const where = {
      approvalStatus: 'APPROVED'
    };

    if (category && category !== 'ALL') {
      where.category = category;
    }

    if (city) {
      where.city = { contains: city, mode: 'insensitive' };
    }

    if (locality) {
      where.locality = { contains: locality, mode: 'insensitive' };
    }

    if (isAvailable === 'true') {
      where.isAvailable = true;
    }

    if (minPrice || maxPrice) {
      where.startingPrice = {};
      if (minPrice) where.startingPrice.gte = parseFloat(minPrice);
      if (maxPrice) where.startingPrice.lte = parseFloat(maxPrice);
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { locality: { contains: q, mode: 'insensitive' } },
        { address: { contains: q, mode: 'insensitive' } }
      ];
    }

    // Fetch amenities matching base criteria
    const rawAmenities = await prisma.amenity.findMany({
      where,
      include: {
        images: {
          orderBy: { isCover: 'desc' },
          take: 3
        },
        subscriptionPlans: {
          orderBy: { price: 'asc' }
        },
        reviews: {
          select: { rating: true }
        },
        provider: {
          select: { id: true, name: true, phone: true }
        }
      }
    });

    // Check user's saved amenities if authenticated
    let savedIds = new Set();
    if (req.user) {
      const saved = await prisma.savedAmenity.findMany({
        where: { userId: req.user.id },
        select: { amenityId: true }
      });
      savedIds = new Set(saved.map((s) => s.amenityId));
    }

    // Process ratings and distances
    let results = rawAmenities.map((amenity) => {
      const totalReviews = amenity.reviews.length;
      const averageRating = totalReviews > 0
        ? Number((amenity.reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1))
        : 0;

      let distanceKm = null;
      if (userLat && userLng) {
        distanceKm = calculateDistance(
          parseFloat(userLat),
          parseFloat(userLng),
          amenity.latitude,
          amenity.longitude
        );
      }

      const coverImage =
        amenity.images.find((img) => img.isCover)?.url ||
        amenity.images[0]?.url ||
        'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800';

      return {
        id: amenity.id,
        name: amenity.name,
        category: amenity.category,
        description: amenity.description,
        address: amenity.address,
        locality: amenity.locality,
        city: amenity.city,
        latitude: amenity.latitude,
        longitude: amenity.longitude,
        startingPrice: amenity.startingPrice,
        billingPeriod: amenity.billingPeriod,
        isAvailable: amenity.isAvailable,
        isFeatured: amenity.isFeatured,
        operatingHours: amenity.operatingHours,
        contactPhone: amenity.contactPhone,
        perks: amenity.perks,
        coverImage,
        images: amenity.images.map((img) => img.url),
        subscriptionPlans: amenity.subscriptionPlans,
        averageRating,
        totalReviews,
        distanceKm,
        isSaved: savedIds.has(amenity.id),
        providerName: amenity.provider.name
      };
    });

    // Apply minRating filter if specified
    if (minRating) {
      const minR = parseFloat(minRating);
      results = results.filter((a) => a.averageRating >= minR);
    }

    // Apply maxDistance filter if specified
    if (maxDistance && userLat && userLng) {
      const maxD = parseFloat(maxDistance);
      results = results.filter((a) => a.distanceKm !== null && a.distanceKm <= maxD);
    }

    // Sort results
    if (sortBy === 'nearest' && userLat && userLng) {
      results.sort((a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999));
    } else if (sortBy === 'price_asc') {
      results.sort((a, b) => a.startingPrice - b.startingPrice);
    } else if (sortBy === 'price_desc') {
      results.sort((a, b) => b.startingPrice - a.startingPrice);
    } else if (sortBy === 'rating_desc') {
      results.sort((a, b) => b.averageRating - a.averageRating || b.totalReviews - a.totalReviews);
    }

    res.json({
      success: true,
      count: results.length,
      amenities: results
    });
  } catch (error) {
    next(error);
  }
};

const getAmenityById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const amenity = await prisma.amenity.findUnique({
      where: { id },
      include: {
        images: true,
        subscriptionPlans: {
          orderBy: { price: 'asc' }
        },
        reviews: {
          include: {
            user: {
              select: { id: true, name: true, avatar: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        provider: {
          select: { id: true, name: true, email: true, phone: true, avatar: true, bio: true }
        }
      }
    });

    if (!amenity) {
      return res.status(404).json({ message: 'Amenity listing not found.' });
    }

    const totalReviews = amenity.reviews.length;
    const averageRating = totalReviews > 0
      ? Number((amenity.reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1))
      : 0;

    let isSaved = false;
    if (req.user) {
      const saved = await prisma.savedAmenity.findUnique({
        where: {
          userId_amenityId: {
            userId: req.user.id,
            amenityId: amenity.id
          }
        }
      });
      isSaved = !!saved;
    }

    res.json({
      success: true,
      amenity: {
        ...amenity,
        averageRating,
        totalReviews,
        isSaved
      }
    });
  } catch (error) {
    next(error);
  }
};

const createAmenity = async (req, res, next) => {
  try {
    const {
      name,
      category,
      description,
      address,
      locality,
      city = 'Bengaluru',
      latitude,
      longitude,
      startingPrice,
      billingPeriod = 'monthly',
      isAvailable = true,
      operatingHours,
      contactPhone,
      contactEmail,
      perks = [],
      images = [],
      subscriptionPlans = []
    } = req.body;

    if (!name || !category || !description || !address || !startingPrice) {
      return res.status(400).json({ message: 'Missing required listing information.' });
    }

    const defaultLat = latitude ? parseFloat(latitude) : 12.935;
    const defaultLng = longitude ? parseFloat(longitude) : 77.625;

    const newAmenity = await prisma.amenity.create({
      data: {
        providerId: req.user.id,
        name: name.trim(),
        category,
        description: description.trim(),
        address: address.trim(),
        locality: (locality || address.split(',')[0]).trim(),
        city: city.trim(),
        latitude: defaultLat,
        longitude: defaultLng,
        startingPrice: parseFloat(startingPrice),
        billingPeriod,
        isAvailable: Boolean(isAvailable),
        approvalStatus: req.user.role === 'ADMIN' ? 'APPROVED' : 'APPROVED', // auto-approve in demo
        operatingHours: operatingHours?.trim(),
        contactPhone: contactPhone || req.user.phone,
        contactEmail: contactEmail || req.user.email,
        perks: Array.isArray(perks) ? perks : [],
        images: {
          create: images.length > 0
            ? images.map((img, idx) => ({
                url: typeof img === 'string' ? img : img.url,
                caption: typeof img === 'string' ? '' : img.caption || '',
                isCover: idx === 0
              }))
            : [{ url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800', isCover: true }]
        },
        subscriptionPlans: {
          create: subscriptionPlans.length > 0
            ? subscriptionPlans.map((plan) => ({
                name: plan.name,
                durationDays: parseInt(plan.durationDays, 10) || 30,
                price: parseFloat(plan.price),
                features: Array.isArray(plan.features) ? plan.features : [],
                isPopular: Boolean(plan.isPopular)
              }))
            : [
                {
                  name: 'Monthly Standard Plan',
                  durationDays: 30,
                  price: parseFloat(startingPrice),
                  features: ['Standard access', 'Customer support', 'Direct contact with provider'],
                  isPopular: true
                }
              ]
        }
      },
      include: {
        images: true,
        subscriptionPlans: true
      }
    });

    res.status(201).json({
      success: true,
      message: 'Amenity listing created successfully!',
      amenity: newAmenity
    });
  } catch (error) {
    next(error);
  }
};

const updateAmenity = async (req, res, next) => {
  try {
    const { id } = req.params;
    const amenity = await prisma.amenity.findUnique({ where: { id } });

    if (!amenity) {
      return res.status(404).json({ message: 'Amenity not found.' });
    }

    // Role check: Admin or the provider who owns the listing
    if (req.user.role !== 'ADMIN' && amenity.providerId !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden. You do not own this listing.' });
    }

    const {
      name,
      category,
      description,
      address,
      locality,
      city,
      latitude,
      longitude,
      startingPrice,
      isAvailable,
      operatingHours,
      contactPhone,
      contactEmail,
      perks
    } = req.body;

    const updated = await prisma.amenity.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(category && { category }),
        ...(description && { description: description.trim() }),
        ...(address && { address: address.trim() }),
        ...(locality && { locality: locality.trim() }),
        ...(city && { city: city.trim() }),
        ...(latitude !== undefined && { latitude: parseFloat(latitude) }),
        ...(longitude !== undefined && { longitude: parseFloat(longitude) }),
        ...(startingPrice !== undefined && { startingPrice: parseFloat(startingPrice) }),
        ...(isAvailable !== undefined && { isAvailable: Boolean(isAvailable) }),
        ...(operatingHours !== undefined && { operatingHours }),
        ...(contactPhone !== undefined && { contactPhone }),
        ...(contactEmail !== undefined && { contactEmail }),
        ...(perks !== undefined && { perks })
      },
      include: {
        images: true,
        subscriptionPlans: true
      }
    });

    res.json({
      success: true,
      message: 'Listing updated successfully.',
      amenity: updated
    });
  } catch (error) {
    next(error);
  }
};

const deleteAmenity = async (req, res, next) => {
  try {
    const { id } = req.params;
    const amenity = await prisma.amenity.findUnique({ where: { id } });

    if (!amenity) {
      return res.status(404).json({ message: 'Amenity not found.' });
    }

    if (req.user.role !== 'ADMIN' && amenity.providerId !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden. You do not own this listing.' });
    }

    await prisma.amenity.delete({ where: { id } });

    res.json({
      success: true,
      message: 'Amenity listing deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

const toggleSaveAmenity = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const existing = await prisma.savedAmenity.findUnique({
      where: {
        userId_amenityId: {
          userId,
          amenityId: id
        }
      }
    });

    if (existing) {
      await prisma.savedAmenity.delete({
        where: { id: existing.id }
      });
      return res.json({ success: true, saved: false, message: 'Removed from saved amenities.' });
    } else {
      await prisma.savedAmenity.create({
        data: {
          userId,
          amenityId: id
        }
      });
      return res.json({ success: true, saved: true, message: 'Added to saved amenities.' });
    }
  } catch (error) {
    next(error);
  }
};

const getSavedAmenities = async (req, res, next) => {
  try {
    const saved = await prisma.savedAmenity.findMany({
      where: { userId: req.user.id },
      include: {
        amenity: {
          include: {
            images: { take: 1 },
            subscriptionPlans: { take: 1 },
            reviews: { select: { rating: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formatted = saved.map((s) => {
      const a = s.amenity;
      const totalReviews = a.reviews.length;
      const averageRating = totalReviews > 0
        ? Number((a.reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1))
        : 0;
      return {
        id: a.id,
        name: a.name,
        category: a.category,
        locality: a.locality,
        city: a.city,
        startingPrice: a.startingPrice,
        billingPeriod: a.billingPeriod,
        coverImage: a.images[0]?.url || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800',
        averageRating,
        totalReviews,
        savedAt: s.createdAt
      };
    });

    res.json({
      success: true,
      amenities: formatted
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAmenities,
  getAmenityById,
  createAmenity,
  updateAmenity,
  deleteAmenity,
  toggleSaveAmenity,
  getSavedAmenities
};
