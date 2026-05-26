const express = require('express');
const cors = require('cors');
const midtransClient = require('midtrans-client');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// 1. Konfigurasi Midtrans
let snap = new midtransClient.Snap({
    isProduction: false,
    serverKey: process.env.MIDTRANS_SERVER_KEY,
    clientKey: process.env.MIDTRANS_CLIENT_KEY
});

// 2. Endpoint: Cek Ongkir (RajaOngkir)
app.post('/api/shipping-cost', async (req, res) => {
    try {
        const { destination, weight, courier } = req.body;
        // Simulasi hit RajaOngkir (Ganti URL dengan API asli jika sudah punya Key)
        // Default: JNE ke Jakarta
        const response = await axios.post('https://api.rajaongkir.com/starter/cost', {
            origin: '153', // Contoh: Jakarta Selatan
            destination: destination || '151', 
            weight: weight || 1000,
            courier: courier || 'jne'
        }, {
            headers: { 'key': process.env.RAJAONGKIR_API_KEY }
        });
        
        res.json(response.data.rajaongkir.results[0].costs[0].cost[0].value);
    } catch (error) {
        // Jika API Key belum ada, kirim harga flat sebagai fallback
        res.json(15000); 
    }
});

// 3. Endpoint: Buat Transaksi Midtrans
app.post('/api/checkout', async (req, res) => {
    try {
        const { order_id, gross_amount, customer_details, item_details } = req.body;

        let parameter = {
            "transaction_details": {
                "order_id": order_id,
                "gross_amount": gross_amount
            },
            "item_details": item_details,
            "customer_details": customer_details,
            "credit_card": { "secure": true }
        };

        const transaction = await snap.createTransaction(parameter);
        res.json({ token: transaction.token });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server jalan di http://localhost:${PORT}`));
