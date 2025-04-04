import React, { useEffect, useState, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { CheckCircle, Package, Truck, CreditCard } from 'lucide-react';
import { FishDataContext } from '../contexts/FishDataContext';

interface OrderItem {
  id: string;
  name_at_time: string;
  quantity: number;
  price_at_time: number;
  fish_id: string;
}

interface OrderDetails {
  id: string;
  order_number: string;
  status: string;
  created_at: string;
  total_amount: number;
  shipping_address: {
    firstName: string;
    lastName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    email: string;
  };
  items: OrderItem[];
}

const SuccessPage = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { updateFishQuantities } = useContext(FishDataContext);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        if (!orderId) {
          setError('No order ID provided');
          setLoading(false);
          return;
        }

        setLoading(true);
        
        // Fetch order details
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .single();

        if (orderError) {
          throw orderError;
        }

        // Fetch order items with fish_id
        const { data: itemsData, error: itemsError } = await supabase
          .from('order_items')
          .select('id, name_at_time, quantity, price_at_time, fish_id')
          .eq('order_id', orderId);

        if (itemsError) {
          throw itemsError;
        }

        setOrder({
          ...orderData,
          items: itemsData
        });
      } catch (error) {
        console.error('Error fetching order details:', error);
        setError('Failed to load order details. Please check your order confirmation email.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId]);

  // Handler for continuing shopping with updated quantities
  const handleContinueShopping = () => {
    if (order && order.items) {
      // Format the items for the updateFishQuantities function
      const orderItems = order.items.map(item => ({
        fish_id: item.fish_id,
        quantity: item.quantity
      }));
      
      console.log('Updating fish quantities with order items:', orderItems);
      
      // Update the quantities in the FishDataContext
      updateFishQuantities(orderItems);
      
      // Navigate to home
      navigate('/');
    } else {
      console.log('No order or items available for quantity update');
      // If no order data, just navigate to home
      navigate('/');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <div className="text-red-600 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            {error || 'Order not found'}
          </h2>
          <p className="text-gray-600 mb-6">
            We couldn't find the order details you're looking for.
          </p>
          <Link 
            to="/" 
            className="inline-block bg-orange-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-orange-600 transition-colors"
          >
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  // Calculate subtotal
  const subtotal = order.items.reduce((sum, item) => sum + (item.price_at_time * item.quantity), 0);
  const tax = order.total_amount - subtotal > 0 ? order.total_amount - subtotal : order.total_amount * 0.07;
  const shipping = subtotal > 200 ? 0 : 15;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-4 mb-8">
          <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">
              Thank You for Your Order!
            </h2>
            <p className="text-gray-600">
              Order #{order.order_number}
            </p>
          </div>
        </div>

        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-blue-800">
            A confirmation email has been sent to <strong>{order.shipping_address.email}</strong> with your order details.
          </p>
          <p className="text-blue-800 mt-2">
            If you don't see it, please check your spam folder. Our team has also been notified of your order and will process it soon.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-3">
                <Package className="h-5 w-5" />
                Order Details
              </div>
              <div className="space-y-3">
                {order.items.map(item => (
                  <div key={item.id} className="flex justify-between">
                    <div>
                      <div className="font-medium">{item.name_at_time}</div>
                      <div className="text-sm text-gray-600">
                        Qty: {item.quantity} × ${item.price_at_time.toFixed(2)}
                      </div>
                    </div>
                    <div className="font-medium">
                      ${(item.quantity * item.price_at_time).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-3">
                <Truck className="h-5 w-5" />
                Shipping Address
              </div>
              <div className="text-gray-600">
                <p>{order.shipping_address.firstName} {order.shipping_address.lastName}</p>
                <p>{order.shipping_address.addressLine1}</p>
                {order.shipping_address.addressLine2 && <p>{order.shipping_address.addressLine2}</p>}
                <p>{order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.postalCode}</p>
              </div>
            </div>
          </div>

          <div>
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="text-lg font-semibold text-gray-900 mb-4">
                Order Summary
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tax</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span>
                    {shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-semibold pt-2 border-t">
                  <span>Total</span>
                  <span>${order.total_amount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 text-center">
              <p className="text-gray-600 mb-4">
                You will receive updates about your order status via email.
              </p>
              <button
                onClick={handleContinueShopping}
                className="bg-orange-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-orange-600 transition-colors inline-block"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuccessPage; 