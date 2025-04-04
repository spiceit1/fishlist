import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Key, AlertCircle, Save, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const AccountPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [profileTableExists, setProfileTableExists] = useState(true);

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  // Load user data
  useEffect(() => {
    const loadUserData = async () => {
      if (!user) return;

      try {
        setIsProfileLoading(true);
        
        // First check if user_profiles table exists to avoid 404 errors
        const { data: tableCheck, error: tableCheckError } = await supabase
          .from('user_profiles')
          .select('id', { count: 'exact', head: true })
          .limit(1);

        // If we get a "relation does not exist" error, the table doesn't exist
        if (tableCheckError && tableCheckError.code === '42P01') {
          console.log('user_profiles table does not exist, using basic info');
          setProfileTableExists(false);
          // Fall back to basic user info from auth
          setFirstName(user.user_metadata?.first_name || '');
          setLastName(user.user_metadata?.last_name || '');
          setEmail(user.email || '');
          setIsProfileLoading(false);
          return;
        }

        // Get user profile data if table exists
        if (profileTableExists) {
          const { data: profiles, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          
          if (profileError) {
            if (profileError.code === 'PGRST116') {
              // No profile found for this user, we'll create one when they save
              console.log('No profile found for user, will create on save');
            } else {
              console.error('Error loading profile:', profileError);
            }
          } else if (profiles) {
            setFirstName(profiles.first_name || '');
            setLastName(profiles.last_name || '');
          }
        }

        setEmail(user.email || '');

        // Try to get saved addresses
        try {
          const { data: addressData, error: addressError } = await supabase
            .from('shipping_addresses')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          if (addressError) {
            if (addressError.code === '42P01') {
              // Table doesn't exist yet
              console.log('shipping_addresses table does not exist');
            } else {
              console.error('Error loading addresses:', addressError);
            }
          } else {
            setAddresses(addressData || []);
          }
        } catch (addressError) {
          console.error('Error in address fetch:', addressError);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setIsProfileLoading(false);
      }
    };

    loadUserData();
  }, [user]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!user) return;

    try {
      setIsSaving(true);

      if (profileTableExists) {
        // Update profile information in user_profiles table
        const { error: profileError } = await supabase
          .from('user_profiles')
          .upsert({
            id: user.id,
            first_name: firstName,
            last_name: lastName,
            updated_at: new Date().toISOString()
          });

        if (profileError) {
          if (profileError.code === '42P01') {
            // Table doesn't exist, update metadata instead
            setProfileTableExists(false);
            const { error: metadataError } = await supabase.auth.updateUser({
              data: { first_name: firstName, last_name: lastName }
            });
            
            if (metadataError) throw metadataError;
          } else {
            throw profileError;
          }
        }
      } else {
        // Update user metadata directly
        const { error: metadataError } = await supabase.auth.updateUser({
          data: { first_name: firstName, last_name: lastName }
        });
        
        if (metadataError) throw metadataError;
      }

      setSuccessMessage('Profile updated successfully');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setError(error.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!user) return;

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    try {
      setIsSaving(true);

      // First verify current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email || '',
        password: currentPassword
      });

      if (signInError) {
        setError('Current password is incorrect');
        setIsSaving(false);
        return;
      }

      // Change password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) throw updateError;

      // Clear password fields
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      setSuccessMessage('Password updated successfully');
    } catch (error: any) {
      console.error('Error updating password:', error);
      setError(error.message || 'Failed to update password');
    } finally {
      setIsSaving(false);
    }
  };

  // If still loading, show loading indicator
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <User className="h-8 w-8 text-orange-500" />
            <h1 className="text-2xl font-bold text-gray-900">Your Account</h1>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <div>{error}</div>
            </div>
          )}

          {successMessage && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
              <Check className="h-5 w-5 flex-shrink-0" />
              <div>{successMessage}</div>
            </div>
          )}

          <div className="space-y-6">
            {/* Profile Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h2>
              
              {isProfileLoading ? (
                <div className="flex justify-center py-6">
                  <div className="animate-spin h-6 w-6 border-3 border-orange-500 border-t-transparent rounded-full"></div>
                </div>
              ) : (
                <form onSubmit={handleProfileUpdate} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        value={email}
                        disabled
                        className="w-full rounded-md border-gray-300 bg-gray-100 shadow-sm pl-10"
                      />
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      Contact support to change your email address
                    </p>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
                    >
                      <Save className="h-4 w-4" />
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Change Password */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h2>
              
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 pl-10"
                    />
                    <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 pl-10"
                    />
                    <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 pl-10"
                    />
                    <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
                  >
                    <Key className="h-4 w-4" />
                    {isSaving ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>
            </div>

            {/* Saved Addresses */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Saved Addresses</h2>
              
              {addresses.length === 0 ? (
                <p className="text-gray-600">You don't have any saved addresses yet.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {addresses.map((address) => (
                    <div key={address.id} className="border rounded-lg p-4">
                      <div className="font-medium">{address.first_name} {address.last_name}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        <div>{address.address_line1}</div>
                        {address.address_line2 && <div>{address.address_line2}</div>}
                        <div>{address.city}, {address.state} {address.postal_code}</div>
                        <div>{address.phone}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Order History Link */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Orders</h2>
              <button
                onClick={() => navigate('/orders')}
                className="text-orange-500 hover:text-orange-600 font-medium"
              >
                View order history →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountPage; 