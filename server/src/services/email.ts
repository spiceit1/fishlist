import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';

// Ensure environment variables are loaded
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Create a transporter object
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface Address {
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  email: string;
}

interface OrderSummary {
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
}

interface OrderDetails {
  orderNumber: string;
  items: OrderItem[];
  shippingAddress: Address;
  orderSummary: OrderSummary;
  paymentMethod: {
    last4: string;
    brand: string;
  };
}

/**
 * Send order confirmation email to customer
 */
export const sendCustomerOrderConfirmation = async (orderDetails: OrderDetails): Promise<boolean> => {
  try {
    const { orderNumber, items, shippingAddress, orderSummary, paymentMethod } = orderDetails;
    const { firstName, lastName, email } = shippingAddress;
    const { subtotal, tax, shipping, total } = orderSummary;

    // Create items HTML
    const itemsHtml = items.map(item => `
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #eee;">${item.name}</td>
        <td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right;">$${item.price.toFixed(2)}</td>
        <td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right;">$${(item.quantity * item.price).toFixed(2)}</td>
      </tr>
    `).join('');

    // Send email
    await transporter.sendMail({
      from: `"Anemone King" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Order Confirmation #${orderNumber} - Anemone King`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #FF7F50; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">Order Confirmation</h1>
            <p style="margin: 5px 0 0;">Order #${orderNumber}</p>
          </div>
          
          <div style="padding: 20px; border: 1px solid #eee; border-top: none;">
            <p>Dear ${firstName} ${lastName},</p>
            <p>Thank you for your order! We're processing it now and will ship it soon.</p>
            
            <h2 style="margin-top: 30px; color: #FF7F50;">Order Summary</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="border-bottom: 2px solid #FF7F50;">
                  <th style="text-align: left; padding: 10px 0;">Item</th>
                  <th style="text-align: center; padding: 10px 0;">Qty</th>
                  <th style="text-align: right; padding: 10px 0;">Price</th>
                  <th style="text-align: right; padding: 10px 0;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="3" style="text-align: right; padding: 10px 0;">Subtotal:</td>
                  <td style="text-align: right; padding: 10px 0;">$${subtotal.toFixed(2)}</td>
                </tr>
                <tr>
                  <td colspan="3" style="text-align: right; padding: 10px 0;">Tax:</td>
                  <td style="text-align: right; padding: 10px 0;">$${tax.toFixed(2)}</td>
                </tr>
                <tr>
                  <td colspan="3" style="text-align: right; padding: 10px 0;">Shipping:</td>
                  <td style="text-align: right; padding: 10px 0;">${shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</td>
                </tr>
                <tr style="font-weight: bold;">
                  <td colspan="3" style="text-align: right; padding: 15px 0; border-top: 2px solid #FF7F50;">Total:</td>
                  <td style="text-align: right; padding: 15px 0; border-top: 2px solid #FF7F50;">$${total.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
            
            <div style="margin-top: 30px; display: flex; justify-content: space-between;">
              <div style="width: 48%;">
                <h3 style="color: #FF7F50; margin-top: 0;">Shipping Address</h3>
                <p style="margin: 0;">
                  ${firstName} ${lastName}<br>
                  ${shippingAddress.addressLine1}<br>
                  ${shippingAddress.addressLine2 ? shippingAddress.addressLine2 + '<br>' : ''}
                  ${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.postalCode}
                </p>
              </div>
              <div style="width: 48%;">
                <h3 style="color: #FF7F50; margin-top: 0;">Payment Method</h3>
                <p style="margin: 0;">
                  ${paymentMethod.brand} ending in ${paymentMethod.last4}
                </p>
              </div>
            </div>
            
            <div style="margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
              <p>If you have any questions about your order, please contact us at anemoneking99@gmail.com</p>
              <p>Thank you for shopping with Anemone King!</p>
            </div>
          </div>
        </div>
      `,
    });

    return true;
  } catch (error) {
    console.error('Error sending customer confirmation email:', error);
    return false;
  }
};

/**
 * Send order notification email to admin
 */
export const sendAdminOrderNotification = async (orderDetails: OrderDetails): Promise<boolean> => {
  try {
    const { orderNumber, items, shippingAddress, orderSummary } = orderDetails;
    const { firstName, lastName, email, addressLine1, addressLine2, city, state, postalCode } = shippingAddress;
    const { total } = orderSummary;

    // Create items list
    const itemsList = items.map(item => 
      `${item.name} (${item.quantity} × $${item.price.toFixed(2)} = $${(item.quantity * item.price).toFixed(2)})`
    ).join('\n- ');

    // Send email
    await transporter.sendMail({
      from: `"Anemone King Orders" <${process.env.EMAIL_USER}>`,
      to: 'anemoneking99@gmail.com',
      subject: `New Order #${orderNumber} - $${total.toFixed(2)}`,
      text: `
New Order #${orderNumber}

Customer: ${firstName} ${lastName} (${email})

Shipping Address:
${firstName} ${lastName}
${addressLine1}
${addressLine2 ? addressLine2 + '\n' : ''}${city}, ${state} ${postalCode}

Items:
- ${itemsList}

Total: $${total.toFixed(2)}

View order details in the admin dashboard.
      `,
    });

    return true;
  } catch (error) {
    console.error('Error sending admin notification email:', error);
    return false;
  }
}; 