import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe with your publishable key
// For testing, you can temporarily hardcode your test publishable key here
// Or add VITE_STRIPE_PUBLISHABLE_KEY to your environment
export const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 
  'pk_test_51Rlpm6CaDTRDsxQR4Ulin9P2OvciuZKBltxEQDfvu8jqMN9fK7L4e8boLlX8rCUWsVQKy4PYKDeEve4R4eIfi94b00fi8fJHOa' // Replace with your actual test key temporarily
);
