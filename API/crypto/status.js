module.exports = async (req, res) => {
  const { orderId, method } = req.query;
  
  if (!orderId) return res.status(400).json({ error: 'Missing orderId' });
  
  // Check stored payment status
  const payment = global.cryptoPayments?.[orderId];
  
  if (!payment) return res.json({ status: 'not_found' });
  
  // In production: Check blockchain or exchange API for actual payment
  // For demo, simulate confirmation after some time or check Binance/OKX APIs
  
  res.json({ 
    status: payment.status,
    method: payment.method,
    amount: payment.amount,
    confirmedAt: payment.confirmedAt
  });
};
    
