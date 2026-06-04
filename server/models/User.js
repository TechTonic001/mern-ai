const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  passwordHash: {
    type: String,
    required: true,
    select: false,
  },
  plan: {
    type: String,
    enum: ['free', 'pro'],
    default: 'free',
  },
  ttsCredits: {
    type: Number,
    default: 10,
    min: 0,
  },
  ttvCredits: {
    type: Number,
    default: 5,
    min: 0,
  },
}, { timestamps: true });

UserSchema.pre('save', async function hashPassword() {
  if (!this.isModified('passwordHash')) {
    return;
  }

  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
});

UserSchema.methods.comparePassword = function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

module.exports = mongoose.model('User', UserSchema);