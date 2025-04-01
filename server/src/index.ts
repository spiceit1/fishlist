import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import paypalRoutes from './routes/paypal';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/paypal', paypalRoutes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 