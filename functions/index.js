const functions = require("firebase-functions");
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const midtransClient = require('midtrans-client');

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// API KEYS ANDA
const MIDTRANS_SERVER_KEY = "Mid-server-4t8bVEGwU0MTkR0hd7pJ3FtG";
const RAJAONGKIR_KEY = "I3441WxX7e31ba4bf725664bK0VjJavh";

const snap = new midtransClient.Snap({
    isProduction: false,
    serverKey: MIDTRANS_SERVER_KEY
});

// Endpoint untuk cek server
app.get('/', (req, res) => res.send("API TokoKita Cloud Berjalan!"));

// Endpoint Ongkir
app.post('/ongkir', async (req, res) => {
    try {
        const { destination, courier } = req.body;
        const response = await axios.post('https://api.rajaongkir.com/starter/cost', {
            origin: '153',
            destination: destination || '151',
            weight: 1000,
            courier: courier || 'jne'
        }, { headers: { 'key': RAJAONGKIR_KEY } });
        res.json({ cost: response.data.rajaongkir.results[0].costs[0].cost[0].value });
    } catch (error) { res.json({ cost: 15000 }); }
});

// Endpoint Checkout
app.post('/checkout', async (req, res) => {
    try {
        const { amount, customer, items } = req.body;
        let parameter = {
            "transaction_details": { "order_id": "TOKO-" + Date.now(), "gross_amount": amount },
            "customer_details": customer,
            "item_details": items
        };
        const transaction = await snap.createTransaction(parameter);
        res.json({ token: transaction.token });
    } catch (error) { res.status(500).send(error.message); }
});

// Export ke Cloud Functions dengan nama 'api'
exports.api = functions.https.onRequest(app);