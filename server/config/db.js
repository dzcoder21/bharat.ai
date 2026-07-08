const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/bharatai',
      { serverSelectionTimeoutMS: 5000 }
    );
    console.log(`✅ MongoDB: ${conn.connection.host}`);
  } catch (err) {
    console.warn('⚠️  MongoDB offline — history/trending disabled');
  }
};

module.exports = connectDB;
