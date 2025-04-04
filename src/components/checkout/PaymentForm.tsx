import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { CreditCard } from 'lucide-react';
import { CartItem } from '../../types';

export interface PaymentFormData {
  paymentMethodId?: string;
  savedCardId?: string;
  saveCard?: boolean;
  cardNumber?: string;
  expiryMonth?: string;
  expiryYear?: string;
}

export interface PaymentFormProps {
  items: CartItem[];
  total: number;
  onSubmit: (data: PaymentFormData) => Promise<void>;
  savedCards?: Array<{
    id: string;
    brand: string;
    last4: string;
    expiryMonth: string;
    expiryYear: string;
  }>;
  showSaveCard?: boolean;
}

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: '#32325d',
      fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
      fontSmoothing: 'antialiased',
      fontSize: '16px',
      '::placeholder': {
        color: '#aab7c4'
      }
    },
    invalid: {
      color: '#fa755a',
      iconColor: '#fa755a'
    }
  }
};

const PaymentForm: React.FC<PaymentFormProps> = ({
  items,
  total,
  onSubmit,
  savedCards = [],
  showSaveCard = false
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [saveCard, setSaveCard] = useState(false);
  const [selectedCard, setSelectedCard] = useState<string>('new');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      // Create payment intent first
      const response = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: total,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Payment failed');
      }

      const { clientSecret } = await response.json();

      // Get payment method
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      // Confirm the payment
      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
          },
        }
      );

      if (confirmError) {
        throw confirmError;
      }

      if (paymentIntent.status === 'succeeded') {
        await onSubmit({
          paymentMethodId: paymentIntent.payment_method as string,
          saveCard: false,
        });
      } else {
        throw new Error('Payment failed');
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.message || 'An error occurred while processing your payment.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-6">
        <CreditCard className="h-5 w-5" />
        Payment Method
      </div>

      <form onSubmit={handleSubmit}>
        {savedCards.length > 0 && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Payment Method
            </label>
            <div className="space-y-2">
              {savedCards.map(card => (
                <label
                  key={card.id}
                  className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                >
                  <input
                    type="radio"
                    name="payment-method"
                    value={card.id}
                    checked={selectedCard === card.id}
                    onChange={(e) => setSelectedCard(e.target.value)}
                    className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300"
                  />
                  <div className="ml-3">
                    <span className="font-medium">{card.brand}</span>
                    <span className="text-gray-600 ml-2">•••• {card.last4}</span>
                    <span className="text-gray-600 ml-2">
                      Expires {card.expiryMonth}/{card.expiryYear}
                    </span>
                  </div>
                </label>
              ))}
              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="payment-method"
                  value="new"
                  checked={selectedCard === 'new'}
                  onChange={(e) => setSelectedCard(e.target.value)}
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300"
                />
                <div className="ml-3">
                  <span className="font-medium">New Card</span>
                </div>
              </label>
            </div>
          </div>
        )}

        {selectedCard === 'new' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Card Information
              </label>
              <div className="border rounded-lg p-4">
                <CardElement options={CARD_ELEMENT_OPTIONS} />
              </div>
            </div>

            {showSaveCard && (
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="save-card"
                  checked={saveCard}
                  onChange={(e) => setSaveCard(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                />
                <label htmlFor="save-card" className="ml-2 block text-sm text-gray-900">
                  Save this card for future purchases
                </label>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <div className="mt-6">
          <button
            type="submit"
            disabled={!stripe || processing}
            className={`
              w-full bg-orange-500 text-white px-6 py-3 rounded-lg font-medium
              ${(!stripe || processing) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-orange-600'}
              transition-colors flex items-center justify-center gap-2
            `}
          >
            {processing ? (
              <>
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                Processing...
              </>
            ) : (
              <>Pay ${total.toFixed(2)}</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PaymentForm;