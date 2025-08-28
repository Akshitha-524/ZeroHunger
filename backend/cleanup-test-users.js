// cleanup-test-users.js
const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/user');

const cleanupTestUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Database connected');

    const testEmails = ['testuser@example.com', 'anotheruser@example.com'];
    for (const email of testEmails) {
      const result = await User.deleteOne({ email });
      console.log(`Deleted ${email}:`, result.deletedCount);
    }

    console.log('✅ Cleanup done');
    process.exit(0);
  } catch (err) {
    console.error('MongoDB error:', err);
    process.exit(1);
  }
};

cleanupTestUsers();
