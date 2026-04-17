const crypto = require('crypto');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  const { method, amount, currency, orderId } = req.body;
  
  try {
    let result = {};
    
    if (method === 'binance') {
      // Binance Pay API
      const timestamp = Date.now();
      const nonce = crypto.randomUUID();
      
      const payload = {
        env: { terminalType: 'WEB' },
        merchantTradeNo: orderId,
        orderAmount: amount,
        currency: currency,
        goods: {
          goodsType: '01',
          goodsCategory: 'D000',
          referenceGoodsId: orderId,
          goodsName: 'Blueberries Order'
        },
        returnUrl: `https://${req.headers.host}/success?order=${orderId}`,
        webhookUrl: `https://${req.headers.host}/api/crypto/binance-webhook`
      };
      
      const jsonPayload = JSON.stringify(payload);
      const signature = crypto.createHmac('sha512', process.env.BINANCE_SECRET).update(jsonPayload).digest('hex');
      
      const binanceRes = await fetch('https://bpay.binanceapi.com/binancepay/openapi/v3/order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.BINANCE_API_KEY,
          'X-Signature': signature,
          'X-Timestamp': timestamp,
          'X-Nonce': nonce
        },
        body: jsonPayload
      });
      
      const data = await binanceRes.json();
      
      if (data.status === 'SUCCESS') {
        result = {
          success: true,
          prepayId: data.data.prepayId,
          qrData: data.data.qrContent, // QR code content
          qrLink: data.data.qrLink // Alternative: URL to QR image
        };
      } else {
        throw new Error(data.errorMessage || 'Binance order failed');
      }
      
    } else if (method === 'okx') {
      // OKX API - Generate deposit address or invoice
      const timestamp = new Date().toISOString();
      const body = JSON.stringify({
        amt: amount,
        ccy: currency,
        chain: currency === 'USDT' ? 'ERC20' : 'native',
        expTime: new Date(Date.now() + 15 * 60000).toISOString(),
        description: `Blueberries Order ${orderId}`
      });
      
      const sign = crypto.createHmac('sha256', `${timestamp}${'POST'}${'/api/v5/asset/deposit-address'}${body}`, process.env.OKX_SECRET).digest('base64');
      
      // For demo, return static wallet (in production, generate unique address per order)
      result = {
        success: true,
        address: process.env.CRYPTO_WALLET_USDT,
        chain: 'ERC20',
        memo: orderId // Some chains require memo
      };
    }
    
    // Store pending payment
    global.cryptoPayments = global.cryptoPayments || {};
    global.cryptoPayments[orderId] = {
      method,
      amount,
      currency,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    
    res.json({
      success: true,
      orderId: orderId,
      address: result.address || result.qrData,
      qrData: result.qrData || `ethereum:${process.env.CRYPTO_WALLET_USDT}?amount=${amount}`,
      prepayId: result.prepayId
    });
    
  } catch (error) {
    console.error('Crypto payment error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
