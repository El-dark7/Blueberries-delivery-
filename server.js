const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const app = express();

// M-Pesa Daraja API
app.post('/api/mpesa/stkpush', async (req, res) => {
    const { phone, amount, accountReference } = req.body;
    
    // Generate timestamp and password
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');
    
    // Get access token
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
    const tokenRes = await axios.get('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
        headers: { Authorization: `Basic ${auth}` }
    });
    
    // STK Push
    const stkRes = await axios.post('https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest', {
        BusinessShortCode: shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: amount,
        PartyA: phone,
        PartyB: shortcode,
        PhoneNumber: phone,
        CallBackURL: callbackUrl,
        AccountReference: accountReference,
        TransactionDesc: 'Payment'
    }, {
        headers: { Authorization: `Bearer ${tokenRes.data.access_token}` }
    });
    
    res.json(stkRes.data);
});

// Binance Pay API
app.post('/api/binance/create', async (req, res) => {
    const { orderId, amount } = req.body;
    
    const timestamp = Date.now();
    const payload = {
        env: { terminalType: 'WEB' },
        merchantTradeNo: orderId,
        orderAmount: amount,
        currency: 'USDT',
        goods: { goodsType: '01', goodsCategory: 'D000', referenceGoodsId: orderId, goodsName: 'Blueberries Order' },
        returnUrl: 'https://yourdomain.com/success',
        webhookUrl: 'https://yourdomain.com/api/binance/webhook'
    };
    
    const signature = crypto.createHmac('sha512', secretKey).update(JSON.stringify(payload)).digest('hex');
    
    const result = await axios.post('https://bpay.binanceapi.com/binancepay/openapi/v3/order', payload, {
        headers: {
            'X-API-Key': apiKey,
            'X-Signature': signature,
            'X-Timestamp': timestamp,
            'Content-Type': 'application/json'
        }
    });
    
    res.json(result.data);
});

app.listen(process.env.PORT || 3000);
          
