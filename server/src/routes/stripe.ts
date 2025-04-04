import express from 'express';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import path from 'path';

// Ensure environment variables are loaded
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const router = express.Router();

// Initialize Stripe
let stripe: Stripe;
try {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    console.error('Environment variables loaded:', process.env);
    throw new Error('STRIPE_SECRET_KEY environment variable is not set');
  }
  
  stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2025-03-31.basil'
  });
  console.log('Stripe initialized successfully');
} catch (error) {
  console.error('Failed to initialize Stripe:', error);
  throw error;
}

router.post('/create-payment-intent', async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount) {
      return res.status(400).json({ error: 'Amount is required' });
    }

    console.log('Creating payment intent for amount:', amount);
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true
      }
    });

    console.log('Payment intent created:', paymentIntent.id);
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error: any) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/create-customer', async (req, res) => {
  try {
    const { email, paymentMethodId } = req.body;

    const customer = await stripe.customers.create({
      email,
      payment_method: paymentMethodId,
    });

    res.json({ customerId: customer.id });
  } catch (error: any) {
    console.error('Error creating customer:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/payment-methods/:paymentMethodId', async (req, res) => {
  try {
    const { paymentMethodId } = req.params;

    if (!paymentMethodId) {
      return res.status(400).json({ error: 'Payment method ID is required' });
    }

    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
    res.json(paymentMethod);
  } catch (error: any) {
    console.error('Error retrieving payment method:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router; 