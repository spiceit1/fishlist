import express from 'express';
import { sendCustomerOrderConfirmation, sendAdminOrderNotification } from '../services/email';

const router = express.Router();

router.post('/send-order-emails', async (req, res) => {
  try {
    const orderDetails = req.body;
    
    if (!orderDetails || !orderDetails.orderNumber || !orderDetails.items || !orderDetails.shippingAddress) {
      return res.status(400).json({ error: 'Invalid order details' });
    }

    // Send customer confirmation email
    const customerEmailResult = await sendCustomerOrderConfirmation(orderDetails);
    
    // Send admin notification email
    const adminEmailResult = await sendAdminOrderNotification(orderDetails);

    res.json({ 
      success: true, 
      customerEmailSent: customerEmailResult,
      adminEmailSent: adminEmailResult
    });
  } catch (error: any) {
    console.error('Error sending order emails:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router; 