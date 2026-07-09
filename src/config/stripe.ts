import Stripe from 'stripe';
import { env } from './env';

/**
 * Single Stripe client instance, reused across the payments module.
 * Pin the apiVersion explicitly so a Stripe account upgrade elsewhere
 * doesn't silently change behavior under us.
 */
export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
});
