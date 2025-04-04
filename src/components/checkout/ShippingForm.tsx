import React, { useState, useEffect } from 'react';
import { Package, Mail, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface ShippingFormProps {
  onSubmit: (data: ShippingFormData) => void;
  initialData?: ShippingFormData;
  savedAddresses?: ShippingFormData[];
  onSaveAddress?: (data: ShippingFormData) => void;
  requireEmail?: boolean;
}

export interface ShippingFormData {
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  phone: string;
  email?: string;
}

const ShippingForm: React.FC<ShippingFormProps> = ({
  onSubmit,
  initialData,
  savedAddresses = [],
  onSaveAddress,
  requireEmail = false
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = React.useState<ShippingFormData>(initialData || {
    firstName: '',
    lastName: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    phone: '',
    email: user?.email || ''
  });

  const [selectedAddress, setSelectedAddress] = React.useState<number>(-1);
  const [saveAddress, setSaveAddress] = React.useState(false);
  const [existingCustomer, setExistingCustomer] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [resetPasswordSent, setResetPasswordSent] = useState(false);

  // Prefill email when user logs in or changes
  useEffect(() => {
    if (user?.email && (!formData.email || formData.email === '')) {
      setFormData(prevData => ({
        ...prevData,
        email: user.email || ''
      }));
    }
  }, [user]);

  // Check if email exists when it changes
  useEffect(() => {
    const checkEmailExists = async () => {
      // Skip the check if user is already logged in
      if (user) return;
      
      if (!formData.email || formData.email.trim() === '') return;

      try {
        // We can't directly check if an email exists in Supabase client SDK
        // So let's try to use resetPasswordForEmail, which is a safe method
        // If the response doesn't contain specific "not found" errors, the user likely exists
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(
          formData.email,
          { redirectTo: `${window.location.origin}/reset-password` }
        );
        
        // If there's no error or error doesn't specifically mention user/email not found
        if (!resetError || 
            (resetError.message && 
             !resetError.message.includes("Email not found") && 
             !resetError.message.includes("User not found"))) {
          setExistingCustomer(true);
        } else {
          setExistingCustomer(false);
        }
      } catch (error) {
        console.error('Error checking email:', error);
        // If we get here, don't change the existing customer state
      }
    };

    // Use debouncing to avoid too many API calls
    const timeoutId = setTimeout(() => {
      checkEmailExists();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [formData.email, user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Skip login prompt if user is already logged in
    if (existingCustomer && !showLoginPrompt && !user) {
      setShowLoginPrompt(true);
      return;
    }
    
    if (saveAddress && onSaveAddress) {
      onSaveAddress(formData);
    }
    onSubmit(formData);
  };

  const handleAddressSelect = (index: number) => {
    if (index === -1) {
      setFormData({
        firstName: '',
        lastName: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        postalCode: '',
        phone: '',
        email: ''
      });
    } else {
      setFormData(savedAddresses[index]);
    }
    setSelectedAddress(index);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email || '',
        password
      });

      if (error) throw error;
      
      // Successfully logged in
      if (saveAddress && onSaveAddress) {
        onSaveAddress(formData);
      }
      onSubmit(formData);
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.message && error.message.includes('Invalid login credentials')) {
        setLoginError('Incorrect password. Please try again or use the forgot password option.');
      } else {
        setLoginError('There was a problem signing in. Please try again later.');
      }
    }
  };

  const handleForgotPassword = async () => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(formData.email || '', {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;
      
      setResetPasswordSent(true);
      // For security reasons, don't confirm whether the email exists or not
      setLoginError(null);
    } catch (error) {
      console.error('Reset password error:', error);
      // For security reasons, show a generic message
      setResetPasswordSent(true);
      setLoginError(null);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-6">
        <Package className="h-5 w-5" />
        Shipping Information
      </div>

      {savedAddresses.length > 0 && !showLoginPrompt && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Saved Addresses
          </label>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            {savedAddresses.map((address, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleAddressSelect(index)}
                className={`text-left p-4 rounded-lg border transition-colors ${
                  selectedAddress === index
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium">
                  {address.firstName} {address.lastName}
                </div>
                <div className="text-sm text-gray-600">
                  {address.addressLine1}
                  {address.addressLine2 && <>, {address.addressLine2}</>}
                </div>
                <div className="text-sm text-gray-600">
                  {address.city}, {address.state} {address.postalCode}
                </div>
              </button>
            ))}
            <button
              type="button"
              onClick={() => handleAddressSelect(-1)}
              className={`text-left p-4 rounded-lg border transition-colors ${
                selectedAddress === -1
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium">Use a different address</div>
              <div className="text-sm text-gray-600">
                Enter a new shipping address
              </div>
            </button>
          </div>
        </div>
      )}

      {showLoginPrompt ? (
        <div className="space-y-6">
          {resetPasswordSent ? (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
              If an account with this email exists, a password reset link will be sent to your inbox.
            </div>
          ) : (
            <>
              <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg flex items-start gap-3">
                <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Existing customer detected</p>
                  <p className="text-sm">We found an account with this email. Please login to continue.</p>
                </div>
              </div>
              
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email || ''}
                    disabled
                    className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                  />
                </div>

                {loginError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {loginError}
                  </div>
                )}

                <div className="flex flex-col space-y-4">
                  <button
                    type="submit"
                    className="bg-orange-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-600 transition-colors"
                  >
                    Login & Continue
                  </button>
                  
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-orange-600 hover:text-orange-700 text-sm font-medium transition-colors"
                  >
                    Forgot Password?
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => {
                      setShowLoginPrompt(false);
                      setExistingCustomer(false);
                    }}
                    className="text-gray-600 hover:text-gray-700 text-sm font-medium transition-colors"
                  >
                    Continue as Guest
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                First Name
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Last Name
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
              />
            </div>

            {requireEmail && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <div className="mt-1 relative">
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 pl-10"
                    placeholder="you@example.com"
                  />
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>
              </div>
            )}

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Address Line 1
              </label>
              <input
                type="text"
                value={formData.addressLine1}
                onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Address Line 2 (Optional)
              </label>
              <input
                type="text"
                value={formData.addressLine2}
                onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                City
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                State
              </label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                ZIP Code
              </label>
              <input
                type="text"
                value={formData.postalCode}
                onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                required
                pattern="[0-9]{5}"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
              />
            </div>
          </div>

          {onSaveAddress && selectedAddress === -1 && (
            <div className="flex items-center">
              <input
                type="checkbox"
                id="save-address"
                checked={saveAddress}
                onChange={(e) => setSaveAddress(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
              />
              <label htmlFor="save-address" className="ml-2 block text-sm text-gray-900">
                Save this address for future orders
              </label>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-orange-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-orange-600 transition-colors"
            >
              Continue to Payment
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ShippingForm;