import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { stripe } from '../../config/stripe.js';
import { env } from '../../config/env.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { logger } from '../../utils/logger.js';
import * as paymentService from './payment.service.js';

const router = Router();

/**
 * Stripe's actual "confirm" step happens client-side (Stripe.js calls
 * stripe.confirmCardPayment(clientSecret) directly against Stripe) —
 * there's deliberately no POST /api/payments/confirm for Stripe. This
 * webhook is the only trustworthy place a PaymentIntent's real outcome
 * ever reaches our server, since it's signed by Stripe and can't be
 * spoofed by a client claiming "it succeeded, trust me".
 *
 * Must be mounted in app.ts with `express.raw({ type: 'application/json' })`
 * BEFORE the global `express.json()` middleware — signature verification
 * needs the exact raw request bytes, not the parsed/re-serialized body.
 */
router.post(
  '/stripe',
  catchAsync(async (req: Request, res: Response) => {
    const signature = req.headers['stripe-signature'];

    if (!signature || typeof signature !== 'string') {
      res.status(400).json({ success: false, message: 'Missing Stripe-Signature header' });
      return;
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(req.body, signature, env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      logger.warn(`Stripe webhook signature verification failed: ${(err as Error).message}`);
      res.status(400).json({ success: false, message: 'Invalid webhook signature' });
      return;
    }

    switch (event.type) {
      case 'payment_intent.succeeded':
        await paymentService.handleStripePaymentSucceeded(
          event.data.object as Stripe.PaymentIntent,
        );
        break;
      case 'payment_intent.payment_failed':
        await paymentService.handleStripePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;
      default:
        // Unhandled event types are acknowledged, not treated as errors —
        // Stripe sends far more event types than this module cares about.
        logger.info(`Unhandled Stripe webhook event: ${event.type}`);
    }

    // Stripe only cares about the 2xx/non-2xx distinction; it retries on
    // anything else. Acknowledging with 200 here (rather than routing
    // through sendSuccess's richer envelope) keeps that contract obvious.
    res.status(200).json({ received: true });
  }),
);

export default router;
