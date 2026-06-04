require('../config/env');
const mongoose = require('mongoose');
const User = require('../models/User');

const email = process.argv[2] || 'amoohalleluyah1@gmail.com';
const password = process.argv[3] || '1234567890';

(async () => {
  await mongoose.connect(process.env.MONGO_URI);

  let user = await User.findOne({ email }).select('+passwordHash');
  if (!user) {
    user = await User.create({ email, passwordHash: password });
    console.log('Created user:', email);
  } else {
    user.passwordHash = password;
    user.ttsCredits = Math.max(user.ttsCredits, 50);
    user.ttvCredits = Math.max(user.ttvCredits, 20);
    await user.save();
    console.log('Updated user:', email);
  }

  console.log('TTS credits:', user.ttsCredits, '| TTV credits:', user.ttvCredits);
  await mongoose.disconnect();
})().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
