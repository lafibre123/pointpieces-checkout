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
      const unitAmount = Math.round(Number(item.price) * 100);

      if (!item.name || !unitAmount || unitAmount <= 0 || !item.quantity) {
        throw new Error('Invalid item data');
      }

      return {
        price_data: {
          currency: 'eur',
          product_data: {
            name: item.name,
            description: item.reference ? `Réf: ${item.reference}` : undefined,
            images: item.imageUrl ? [item.imageUrl] : undefined,
          },
          unit_amount: unitAmount,
        },
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
