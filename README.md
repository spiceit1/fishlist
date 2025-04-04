# Anemone King - Premium Saltwater Fish Store

A modern e-commerce application for selling saltwater fish and aquarium supplies, built with React, TypeScript, and Supabase.

## Features

- Product browsing and filtering by category
- User authentication and account management
- Shopping cart functionality
- Secure checkout process
- Order history and tracking
- Admin dashboard for inventory management
- Integration with eBay for listing products
- Responsive design for all devices

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Vite
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Functions)
- **Payment Processing**: Stripe
- **External APIs**: eBay API
- **Hosting**: GitHub Pages/Netlify/Vercel

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/spiceit1/fishlist.git
   cd fishlist
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with your API keys (see `.env.example` for required variables)

4. Start the development server:
   ```bash
   npm run dev
   ```

## Supabase Setup

1. Create a Supabase project at [https://supabase.com](https://supabase.com)
2. Run the necessary migrations:
   ```bash
   npx supabase db push
   ```
3. Set up authentication providers in the Supabase dashboard

## Deployment

This project can be deployed to any static site hosting service:

```bash
npm run build
```

The built files will be in the `dist` directory.

## Authentication

By default, the app uses email/password authentication through Supabase. For development, we've configured automatic sign-in after account creation to bypass email confirmation.

For production deployment, see the authentication setup guide in `docs/AUTH_SETUP.md`.

## Project Structure

- `src/` - Frontend React application
  - `components/` - Reusable UI components
  - `contexts/` - React context providers
  - `hooks/` - Custom React hooks
  - `lib/` - Third-party service configurations
  - `routes/` - Page components
  - `utils/` - Utility functions
- `server/` - Server-side code
- `supabase/` - Supabase configurations and migrations

## License

[MIT](LICENSE)

## Contributors

- [Your Name](https://github.com/spiceit1)