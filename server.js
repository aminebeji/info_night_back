const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');

const app = express();
const PORT = process.env.PORT || 5050;

// Middleware
app.use(cors({
  origin: ['http://localhost:3008', 'http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'API en ligne' });
});

// DB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log(" MongoDB connecté");
    app.listen(PORT, () => console.log(` Serveur sur ${PORT}`));
  })
  .catch(err => console.log(err));
