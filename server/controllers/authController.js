const User      = require('../models/User');
const { signToken } = require('../middleware/authMiddleware');

// ── POST /api/auth/signup ─────────────────────────────────────────────────
exports.signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ error: 'Name, email and password required' });

    if (password.length < 6)
      return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing)
      return res.status(409).json({ error: 'Email already registered. Please login.' });

    const user  = await User.create({ name, email, password });
    const token = signToken(user._id);

    return res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, initials: user.getInitials() },
    });
  } catch (err) {
    console.error('Signup error:', err.message);
    return res.status(500).json({ error: 'Signup failed. Please try again.' });
  }
};

// ── POST /api/auth/login ──────────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: 'Email and password required' });

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user)
      return res.status(401).json({ error: 'No account found with this email' });

    const match = await user.comparePassword(password);
    if (!match)
      return res.status(401).json({ error: 'Incorrect password' });

    user.lastLogin = Date.now();
    await user.save({ validateBeforeSave: false });

    const token = signToken(user._id);

    return res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, initials: user.getInitials() },
    });
  } catch (err) {
    console.error('Login error:', err.message);
    return res.status(500).json({ error: 'Login failed. Please try again.' });
  }
};

// ── GET /api/auth/me ──────────────────────────────────────────────────────
exports.getMe = async (req, res) => {
  const u = req.user;
  return res.json({
    user: { id: u._id, name: u.name, email: u.email, initials: u.getInitials(), createdAt: u.createdAt },
  });
};

// ── DELETE /api/auth/account ──────────────────────────────────────────────
exports.deleteAccount = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user._id);
    return res.json({ message: 'Account deleted' });
  } catch (err) {
    return res.status(500).json({ error: 'Could not delete account' });
  }
};
