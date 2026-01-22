const mongoose = require('mongoose');
require('dotenv').config();

// Fallback to local mongo if env is missing
const mongoURI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/hostel_management_system";

const connectDB = async () => {
    try {
        // Connection options for better stability
        const options = {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000, // Timeout after 5s if can't connect
            socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
            maxPoolSize: 10, // Maintain up to 10 socket connections
            minPoolSize: 2, // Keep minimum 2 connections
            retryWrites: true,
        };

        await mongoose.connect(mongoURI, options);
        console.log('✅ MongoDB connection SUCCESS');
        console.log(`📊 Connected to database: ${mongoose.connection.name}`);

        // Handle connection events
        mongoose.connection.on('error', (err) => {
            console.error('❌ MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('⚠️ MongoDB disconnected. Attempting to reconnect...');
        });

        mongoose.connection.on('reconnected', () => {
            console.log('✅ MongoDB reconnected successfully');
        });

    } catch (error) {
        console.error('❌ MongoDB connection FAIL:', error.message);
        console.log('\n💡 Troubleshooting tips:');
        console.log('1. Check if MONGO_URI is set in .env file');
        console.log('2. Verify IP is whitelisted in MongoDB Atlas');
        console.log('3. Check username/password are correct');
        console.log('4. Ensure network/internet is connected');
    }
};

// Graceful shutdown
process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('MongoDB connection closed due to app termination');
    process.exit(0);
});

module.exports = connectDB;