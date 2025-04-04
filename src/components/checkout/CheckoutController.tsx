import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { CartItem } from '../../types';
import CheckoutLayout from './CheckoutLayout';
import ShippingForm, { ShippingFormData } from './ShippingForm';
import PaymentForm, { PaymentFormData } from './PaymentForm';
import OrderConfirmation from './OrderConfirmation';
import SignUpPrompt from './SignUpPrompt';
import { useCart } from '../../contexts/CartContext';
import axios from 'axios';

interface CheckoutControllerProps {
  items: CartItem[];
  onComplete: () => void;
}

type CheckoutStep = 'shipping' | 'account' | 'payment' | 'confirmation';

const GUEST_USER_ID = '00000000-0000-0000-0000-000000000000';

const CheckoutController: React.FC<CheckoutControllerProps> = ({ items, onComplete }) => {
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('shipping');
  const [shippingData, setShippingData] = useState<ShippingFormData | null>(null);
  const [savedAddresses, setSavedAddresses] = useState<ShippingFormData[]>([]);
  const [savedCards, setSavedCards] = useState<any[]>([]);
  const [orderNumber, setOrderNumber] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<{ brand: string; last4: string; } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGuest, setIsGuest] = useState(true);
  const [guestEmail, setGuestEmail] = useState<string>('');
  const [useSameAddress, setUseSameAddress] = useState(true);
  const [billingAddress, setBillingAddress] = useState<ShippingFormData | null>(null);

  useEffect(() => {
    loadSavedData();
  }, []);

  const loadSavedData = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        setIsGuest(false);
        const { data: addresses, error: addressError } = await supabase
          .from('shipping_addresses')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (addressError) throw addressError;

        if (addresses) {
          setSavedAddresses(addresses.map(addr => ({
            firstName: addr.first_name,
            lastName: addr.last_name,
            addressLine1: addr.address_line1,
            addressLine2: addr.address_line2,
            city: addr.city,
            state: addr.state,
            postalCode: addr.postal_code,
            phone: addr.phone,
            email: addr.email
          })));
        }

        const { data: cards, error: cardsError } = await supabase
          .from('payment_methods')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (cardsError) throw cardsError;

        if (cards) {
          setSavedCards(cards.map(card => ({
            id: card.id,
            brand: card.card_brand,
            last4: card.last_four,
            expiryMonth: card.expiry_month,
            expiryYear: card.expiry_year
          })));
        }
      }
    } catch (error) {
      console.error('Error loading saved data:', error);
      setError('Failed to load saved data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleShippingSubmit = async (data: ShippingFormData) => {
    setShippingData(data);
    setGuestEmail(data.email || '');
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      setCurrentStep('payment');
    } else {
      setCurrentStep('account');
    }
  };

  const handleAccountDecision = async (createAccount: boolean, email?: string, password?: string) => {
    if (createAccount && email && password) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              first_name: shippingData?.firstName,
              last_name: shippingData?.lastName
            }
          }
        });

        if (error) throw error;

        if (data.user) {
          await supabase
            .from('shipping_addresses')
            .insert({
              id: crypto.randomUUID(),
              user_id: data.user.id,
              is_default: false,
              first_name: shippingData?.firstName,
              last_name: shippingData?.lastName,
              address_line1: shippingData?.addressLine1,
              address_line2: shippingData?.addressLine2,
              city: shippingData?.city,
              state: shippingData?.state,
              postal_code: shippingData?.postalCode,
              country: 'US',
              phone: shippingData?.phone,
              email: email,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
        }

        setIsGuest(false);
      } catch (error) {
        console.error('Error creating account:', error);
        setError('Failed to create account. Please try again.');
        return;
      }
    } else {
      setIsGuest(true);
    }

    setCurrentStep('payment');
  };

  const handlePaymentSubmit = async (data: PaymentFormData) => {
    try {
      // Get user info first if not guest
      let userId = GUEST_USER_ID;
      if (!isGuest) {
        const { data: { user } } = await supabase.auth.getUser();
        userId = user?.id || GUEST_USER_ID;
      }

      // Get the next order sequence number
      const { data: sequenceData, error: sequenceError } = await supabase
        .rpc('get_next_order_sequence', { sequence_name: 'order_number' });
      
      if (sequenceError) {
        console.error('Error getting order sequence:', sequenceError);
        throw new Error('Failed to generate order number');
      }
      
      // Format the order number with year, month and sequence
      const now = new Date();
      const year = now.getFullYear().toString().slice(2); // 2-digit year
      const month = (now.getMonth() + 1).toString().padStart(2, '0'); // 2-digit month
      const day = now.getDate().toString().padStart(2, '0'); // 2-digit day
      const orderNumber = `ORD-${year}${month}${day}-${sequenceData}`;
      
      // Save order number for later use
      setOrderNumber(orderNumber);

      // Create the order first as pending
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          id: crypto.randomUUID(), // UUID for the order
          order_number: orderNumber,
          user_id: userId,
          status: 'pending',
          shipping_address: {
            ...shippingData,
            email: isGuest ? guestEmail : shippingData?.email
          },
          billing_address: useSameAddress ? {
            ...shippingData,
            email: isGuest ? guestEmail : shippingData?.email
          } : billingAddress,
          total_amount: calculateTotal().total,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          guest_email: isGuest ? guestEmail : null,
          stripe_payment_intent: null, // Will be updated after payment
          stripe_payment_status: null, // Will be updated after payment
          tracking_number: null,
          shipping_carrier: null,
          tracking_url: null
        })
        .select()
        .single();

      if (orderError) {
        console.error('Order creation error:', orderError);
        throw new Error('Failed to create order');
      }

      const orderItems = items.map(item => ({
        id: crypto.randomUUID(),
        order_id: order.id,
        quantity: item.quantity,
        price_at_time: item.fish.saleCost || 0,
        created_at: new Date().toISOString(),
        fish_id: item.fish.id,
        name_at_time: item.fish.name
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        console.error('Order items creation error:', itemsError);
        // Rollback the order
        await supabase
          .from('orders')
          .delete()
          .eq('id', order.id);
        throw new Error('Failed to create order items');
      }

      // If payment was successful, update order status
      const { error: updateError } = await supabase
        .from('orders')
        .update({ 
          status: 'paid',
          updated_at: new Date().toISOString()
        })
        .eq('id', order.id);

      if (updateError) {
        console.error('Order status update error:', updateError);
        throw new Error('Failed to update order status');
      }

      // Update quantities on hand for each item purchased
      for (const item of items) {
        // Skip processing if this is a category
        if (item.fish.isCategory) continue;
        
        // Get current quantity
        const { data: fishData, error: fishGetError } = await supabase
          .from('fish_data')
          .select('qtyoh, is_category')
          .eq('id', item.fish.id)
          .single();
          
        if (fishGetError) {
          console.error(`Error getting quantity for fish ${item.fish.name}:`, fishGetError);
          continue;
        }
        
        // Skip processing if this is a category (double-check from DB)
        if (fishData.is_category) continue;
        
        const currentQty = fishData.qtyoh || 0;
        const newQty = Math.max(0, currentQty - item.quantity);
        const isOutOfStock = newQty === 0;
        
        // Update quantity and disable item if it's out of stock
        const { error: qtyUpdateError } = await supabase
          .from('fish_data')
          .update({ 
            qtyoh: newQty,
            disabled: isOutOfStock, // Mark as disabled if quantity is zero
            sold_out: isOutOfStock  // Also mark as sold out if quantity is zero
          })
          .eq('id', item.fish.id);
          
        if (qtyUpdateError) {
          console.error(`Error updating quantity for fish ${item.fish.name}:`, qtyUpdateError);
        }
      }

      // Store payment method details for confirmation
      const getPaymentDetails = async () => {
        if (data.paymentMethodId) {
          try {
            // Use Stripe API to get payment method details
            const response = await fetch(`/api/stripe/payment-methods/${data.paymentMethodId}`, {
              method: 'GET'
            });
            
            if (response.ok) {
              const paymentData = await response.json();
              setPaymentMethod({
                brand: paymentData.card.brand || 'card',
                last4: paymentData.card.last4 || '****'
              });
              return {
                brand: paymentData.card.brand || 'card',
                last4: paymentData.card.last4 || '****'
              };
            }
          } catch (error) {
            console.error('Error fetching payment method details:', error);
          }
        }
        
        // Fallback if we can't get the payment details
        return {
          brand: 'Card',
          last4: '****'
        };
      };
      
      const paymentDetails = await getPaymentDetails();

      // Send order confirmation emails
      try {
        const emailData = {
          orderNumber,
          items: items.map(item => ({
            name: item.fish.name,
            quantity: item.quantity,
            price: item.fish.saleCost || 0
          })),
          shippingAddress: {
            ...shippingData,
            email: isGuest ? guestEmail : shippingData?.email || ''
          },
          orderSummary: calculateTotal(),
          paymentMethod: paymentDetails
        };
        
        const emailResponse = await axios.post('/api/email/send-order-emails', emailData);
        console.log('Order emails sent:', emailResponse.data);
      } catch (emailError) {
        // Don't fail the order if email sending fails
        console.error('Error sending order emails:', emailError);
      }

      // Clear the cart after successful checkout
      clearCart();
      
      // Call onComplete to notify parent components
      onComplete();
      
      // Redirect to success page
      navigate(`/success/${order.id}`);
    } catch (error) {
      console.error('Error processing order:', error);
      setError('Failed to process your order. Please try again.');
    }
  };

  const calculateTotal = () => {
    const subtotal = items.reduce((sum, item) => {
      const price = item.fish.saleCost || 0;
      return sum + (price * item.quantity);
    }, 0);

    const tax = subtotal * 0.07;
    const shipping = subtotal > 200 ? 0 : 15;
    const total = subtotal + tax + shipping;

    return { subtotal, tax, shipping, total };
  };

  const handleBack = () => {
    if (currentStep === 'payment') {
      setCurrentStep(isGuest ? 'account' : 'shipping');
    } else if (currentStep === 'account') {
      setCurrentStep('shipping');
    } else {
      navigate('/cart');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const renderStep = () => {
    switch (currentStep) {
      case 'shipping':
        return (
          <ShippingForm
            onSubmit={handleShippingSubmit}
            savedAddresses={savedAddresses}
            requireEmail={true}
            onSaveAddress={async (data) => {
              try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                await supabase
                  .from('shipping_addresses')
                  .insert({
                    id: crypto.randomUUID(),
                    user_id: user.id,
                    is_default: false,
                    first_name: data.firstName,
                    last_name: data.lastName,
                    address_line1: data.addressLine1,
                    address_line2: data.addressLine2 || null,
                    city: data.city,
                    state: data.state,
                    postal_code: data.postalCode,
                    country: 'US',
                    phone: data.phone,
                    email: data.email,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                  });
                await loadSavedData();
              } catch (error) {
                console.error('Error saving address:', error);
              }
            }}
          />
        );

      case 'account':
        return (
          <SignUpPrompt
            shippingData={shippingData!}
            onContinue={handleAccountDecision}
            email={guestEmail}
          />
        );

      case 'payment':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Billing Address</h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="same-address"
                    checked={useSameAddress}
                    onChange={(e) => setUseSameAddress(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                  />
                  <label htmlFor="same-address" className="ml-2 block text-sm text-gray-900">
                    Same as shipping address
                  </label>
                </div>

                {!useSameAddress && (
                  <ShippingForm
                    onSubmit={setBillingAddress}
                    savedAddresses={savedAddresses}
                    requireEmail={false}
                  />
                )}
              </div>
            </div>

            <PaymentForm
              items={items}
              total={calculateTotal().total}
              onSubmit={handlePaymentSubmit}
              savedCards={!isGuest ? savedCards : []}
              showSaveCard={!isGuest}
            />
          </div>
        );

      case 'confirmation':
        return (
          <OrderConfirmation
            orderNumber={orderNumber}
            items={items}
            shippingAddress={shippingData!}
            paymentMethod={paymentMethod!}
            total={calculateTotal()}
            isGuest={isGuest}
            guestEmail={guestEmail}
          />
        );
    }
  };

  return (
    <CheckoutLayout
      step={
        currentStep === 'shipping' ? 1 :
        currentStep === 'account' ? 2 :
        currentStep === 'payment' ? 3 : 4
      }
      totalSteps={4}
      items={items}
      onBack={currentStep !== 'confirmation' ? handleBack : undefined}
    >
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}
      {renderStep()}
    </CheckoutLayout>
  );
};

export default CheckoutController;