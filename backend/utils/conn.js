const mongoose = require('mongoose');
require('dotenv').config();

// Fallback to local mongo if env is missing
const mongoURI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/hostel_management_system";

const connectDB = async () => {
    try {
        await mongoose.connect(mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB connection SUCCESS');
    } catch (error) {
        console.error('MongoDB connection FAIL:', error.message);
        // Do not exit process, so the server can at least start (though DB features will fail)
        // This is better for debugging than a hard crash for a beginner user
        // process.exit(1); 
    }
};

module.exports = connectDB;