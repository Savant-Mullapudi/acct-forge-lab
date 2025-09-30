import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe with your publishable key
// For testing, you can temporarily hardcode your test publishable key here
// Or add VITE_STRIPE_PUBLISHABLE_KEY to your environment
export const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 
  'pk_test_YOUR_KEY_HERE' // Replace with your actual test key temporarily
);
