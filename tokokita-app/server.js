const express = require('express');
const cors = require('cors');
const axios = require('axios');
const midtransClient = require('midtrans-client');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Inisialisasi Midtrans Snap
const snap = new midtransClient.Snap({
    isProduction: false, // Sandbox/Testing
    serverKey: process.env.MIDTRANS_SERVER_KEY,
    clientKey: process.env.MIDTRANS_CLIENT_KEY
});

// Endpoint: Cek Ongkir Real-time
app.post('/api/ongkir', async (req, res) => {
    try {
        const { destination, courier } = req.body;
        const response = await axios.post('https://api.rajaongkir.com/starter/cost', {
            origin: '153', // Jakarta Selatan
            destination: destination || '151', // Jakarta Barat
            weight: 1000,
            courier: courier || 'jne'
        }, {
            headers: { 'key': process.env.RAJAONGKIR_KEY }
        });
        
        const cost = response.data.rajaongkir.results[0].costs[0].cost[0].value;
        res.json({ cost });
    } catch (error) {
        console.error("Gagal ambil ongkir, gunakan tarif flat.");
        res.json({ cost: 15000 });
    }
});

// Endpoint: Buat Snap Token Midtrans
app.post('/api/checkout', async (req, res) => {
    try {
        const { amount, customer, items } = req.body;
        
        let parameter = {
            "transaction_details": {
                "order_id": "TOKO-" + Date.now(),
                "gross_amount": amount
            },
            "credit_card": { "secure": true },
            "customer_details": {
                "first_name": customer.name,
                "email": customer.email,
                "phone": customer.phone
            },
            "item_details": items
        };

        const transaction = await snap.createTransaction(parameter);
        res.json({ token: transaction.token });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server TokoKita lari di http://localhost:${PORT}`));