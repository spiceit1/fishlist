# Authentication Setup Guide

## Configuring Email Confirmations in Supabase

By default, Supabase requires email confirmation for new accounts, which can be inconvenient during development. This document explains how to handle this.

## Automatic Solution

Our application has been modified to automatically sign in the user after account creation, bypassing the need for email confirmation in development.

## Disabling Email Confirmation in Supabase Dashboard

For a complete solution, you can disable email confirmation in your Supabase project:

1. Go to your [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Navigate to **Authentication** → **Providers** → **Email**
4. Uncheck the option "Enable email confirmations"
5. Click "Save"

## Setting Up SMTP for Production

For production environments, you should set up a proper SMTP server to send confirmation emails:

1. Go to **Authentication** → **Email Templates**
2. Configure your SMTP settings
3. Test the email delivery

## Confirming Users Manually

If you need to confirm users manually during development:

1. Go to **Authentication** → **Users**
2. Find the user you want to confirm
3. Click on the three dots (⋮) next to the user
4. Select "Confirm user"

## Troubleshooting

### User Created But Not Authenticated

If a user is created but cannot log in, check if they need email confirmation:

1. Go to **Authentication** → **Users**
2. Check the "Email Confirmed" column
3. If it's "No", confirm the user manually

### Test Environment Email Simulation

For testing environments, you can use services like Mailhog or Mailtrap to catch outgoing emails without actually sending them.

### Security Considerations

Remember that disabling email confirmation reduces security by eliminating verification that users own the email addresses they provide. This is fine for development but should be carefully considered for production environments. 