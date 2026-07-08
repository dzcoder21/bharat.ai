const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String, required: true, trim: true, minlength: 2, maxlength: 50,
  },
  email: {
    type: String, required: true, unique: true,
    lowercase: true, trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email'],
  },
  password: {
    type: String, required: true, minlength: 6, select: false,
  },
  avatar: {
    type: String, default: '',
  },
  createdAt: { type: Date, default: Date.now },
  lastLogin:  { type: Date, default: Date.now },
});

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function (plain) {
  return bcrypt.compare(plain, this.password);
};

// Generate initials avatar color
userSchema.methods.getInitials = function () {
  return this.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

module.exports = mongoose.model('User', userSchema);
