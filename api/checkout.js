import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { items } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'No items provided' });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: items.map(item => ({
        price: item.price,
        quantity: item.quantity,
      })),
      success_url: `${req.headers.origin}/success`,
      cancel_url: `${req.headers.origin}`,
    });

    res.status(200).json({
      url: session.url,
      sessionId: session.id,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Stripe error' });
  }
}
