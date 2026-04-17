const crypto = require('crypto');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  
  const signature = req.headers['x-signature'];
  const payload = JSON.stringify(req.body);
  
  // Verify signature
  const expectedSign = crypto.createHmac('sha512', process.env.BINANCE_SECRET).update(payload).digest('hex');
  
  if (signature !== expectedSign) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  const { data } = req.body;
  
  if (data.status === 'PAID' || data.status === 'SETTLED') {
    global.cryptoPayments = global.cryptoPayments || {};
    if (global.cryptoPayments[data.merchantTradeNo]) {
      global.cryptoPayments[data.merchantTradeNo].status = 'confirmed';
      global.cryptoPayments[data.merchantTradeNo].confirmedAt = new Date().toISOString();
      global.cryptoPayments[data.merchantTradeNo].txId = data.transactionId;
    }
    
    console.log('Binance payment confirmed:', data.merchantTradeNo);
  }
  
  res.json({ success: true });
};
