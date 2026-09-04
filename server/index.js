const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// 1. Initialize Express FIRST
const app = express();
const PORT = process.env.PORT || 5001;

// 2. Middleware
app.use(cors());
app.use(express.json());

// 3. Routes (authRoutes must come AFTER 'app' is initialized)
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

const jobRoutes = require('./routes/jobs');
app.use('/api/jobs', jobRoutes);

const applicantRoutes = require('./routes/applicant');
app.use('/api/applicant', applicantRoutes);

// 4. Database Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB successfully!"))
  .catch((err) => console.error("MongoDB connection error:", err));

// 5. Test route
app.get('/', (req, res) => {
  res.json({ message: "ATS Backend API is running successfully!" });
});

// 6. Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});