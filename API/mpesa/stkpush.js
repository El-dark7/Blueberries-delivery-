const axios = require('axios');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  const { phone, amount, orderId } = req.body;
  
  try {
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
    const password = Buffer.from(`${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`).toString('base64');
    
    // Get access token
    const auth = Buffer.from(`${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`).toString('base64');
    const tokenRes = await axios.get('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
      headers: { Authorization: `Basic ${auth}` }
    });
    
    // STK Push
    const stkRes = await axios.post('https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest', {
      BusinessShortCode: process.env.MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: amount,
      PartyA: phone,
      PartyB: process.env.MPESA_SHORTCODE,
      PhoneNumber: phone,
      CallBackURL: `https://${req.headers.host}/api/mpesa/callback`,
      AccountReference: orderId,
      TransactionDesc: 'Blueberries Delivery'
    }, {
      headers: { Authorization: `Bearer ${tokenRes.data.access_token}` }
    });
    
    res.json({
      success: true,
      checkoutRequestId: stkRes.data.CheckoutRequestID,
      merchantRequestId: stkRes.data.MerchantRequestID,
      orderId: orderId
    });
    
  } catch (error) {
    console.error('M-Pesa STK Push error:', error.response?.data || error.message);
    res.status(500).json({ 
      success: false, 
      error: error.response?.data?.errorMessage || 'Payment initiation failed' 
    });
  }
};
