require('dotenv').config(); // load .env

const mongoose = require('mongoose');
const User = require('./models/user');

const MONGO_URI = process.env.MONGO_URI; // Use your correct URI from .env

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log('✅ Database connected');

    const emailsToDelete = ["testuser@example.com"];
    
    for (const email of emailsToDelete) {
      const res = await User.deleteOne({ email });
      console.log(`Deleted ${email}:`, res.deletedCount);
    }

    mongoose.disconnect();
    console.log('✅ Done');
  })
  .catch(err => console.error('MongoDB connection error:', err));
