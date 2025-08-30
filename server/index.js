// server/index.js
import express from 'express';
import cors from 'cors';
import Stripe from 'stripe';

const app = express();
const stripe = new Stripe('sk_test_51S1fZGFYgNb7BM6b5VxbXHkHke2i8WfORbB6CKgGu06hWD9Q8uVhme6LIx5xs82WDxaeZbN08S6bWrcWe1fVHKmM00C0J8REB6', { apiVersion: '2022-11-15' });

app.use(cors());
app.use(express.json());

app.post('/create-checkout-session', async (req, res) => {
    const { amount, currency = 'usd' } = req.body;

    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency,
                        product_data: { name: 'Order Payment' },
                        unit_amount: amount,
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: 'myapp://delivery',
            cancel_url: 'myapp://index',
        });

        res.json({ url: session.url });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Checkout session creation failed' });
    }
});

app.listen(5000, () => console.log('Server running on port 5000'));
