import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { items } = req.body || {};

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'No items provided' });
    }

    const line_items = items.map((item) => {
      if (!item.price || typeof item.price !== 'string' || !item.price.startsWith('price_')) {
        throw new Error('Invalid item data: missing or invalid Stripe Price ID');
      }

      if (!item.quantity || item.quantity <= 0) {
        throw new Error('Invalid item data: missing or invalid quantity');
      }

      return {
        price: item.price,
        quantity: item.quantity,
      };
    });

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items,
      success_url: 'https://project-vplml.vercel.app/success',
      cancel_url: 'https://project-vplml.vercel.app',
    });

    return res.status(200).json({
      url: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    console.error('Stripe checkout error:', error);

    return res.status(500).json({
      error: 'Stripe error',
      details: error.message,
    });
  }
}
