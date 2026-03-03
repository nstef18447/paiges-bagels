'use client';

import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js';
import { stripePromise } from '@/lib/stripe-client';

interface Props {
  clientSecret: string;
}

export default function EmbeddedCheckoutForm({ clientSecret }: Props) {
  return (
    <EmbeddedCheckoutProvider stripe={stripePromise} options={{ clientSecret }}>
      <EmbeddedCheckout className="cart-checkout-embedded" />
    </EmbeddedCheckoutProvider>
  );
}
