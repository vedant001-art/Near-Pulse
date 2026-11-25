const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../prisma');
const { JWT_SECRET } = require('../middleware/authMiddleware');

const register = async (req, res, next) => {
  try {
    const { name, email, password, role = 'STUDENT_PROFESSIONAL', phone, bio } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    // Check if role is valid
    const allowedRoles = ['STUDENT_PROFESSIONAL', 'SERVICE_PROVIDER', 'ADMIN'];
    const assignedRole = allowedRoles.includes(role) ? role : 'STUDENT_PROFESSIONAL';

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    if (existingUser) {
      return res.status(400).json({ message: 'An account with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        passwordHash,
        role: assignedRole,
        phone: phone ? phone.trim() : null,
        bio: bio ? bio.trim() : null,
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        avatar: true,
        bio: true,
        createdAt: true
      }
    });

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, {
      expiresIn: '7d'
    });

    // Create a welcome notification
    await prisma.notification.create({
      data: {
        userId: user.id,
        title: 'Welcome to NearPulse! 👋',
        message: 'Discover, compare, and subscribe to trusted local amenities near you with ease.',
        type: 'WELCOME'
      }
    });

    res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      token,
      user
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide both email and password.' });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Your account has been deactivated. Please contact admin.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, {
      expiresIn: '7d'
    });

    const { passwordHash, ...userProfile } = user;

    res.json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user: userProfile
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = req.user;

    const [activeSubscriptionsCount, savedCount, unreadNotificationsCount] = await Promise.all([
      prisma.subscription.count({
        where: { userId: user.id, status: 'ACTIVE' }
      }),
      prisma.savedAmenity.count({
        where: { userId: user.id }
      }),
      prisma.notification.count({
        where: { userId: user.id, isRead: false }
      })
    ]);

    res.json({
      success: true,
      user,
      stats: {
        activeSubscriptionsCount,
        savedCount,
        unreadNotificationsCount
      }
    });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, bio, avatar } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(name && { name: name.trim() }),
        ...(phone !== undefined && { phone }),
        ...(bio !== undefined && { bio }),
        ...(avatar && { avatar })
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        avatar: true,
        bio: true,
        createdAt: true
      }
    });

    res.json({
      success: true,
      message: 'Profile updated successfully.',
      user: updatedUser
    });
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  // Realistic password recovery simulation
  res.json({
    success: true,
    message: `If an account exists for ${email}, a password recovery email has been dispatched with reset instructions.`
  });
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  forgotPassword
};
