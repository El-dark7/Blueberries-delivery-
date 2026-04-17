module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  
  const { Body } = req.body;
  
  if (!Body || !Body.stkCallback) {
    return res.json({ ResultCode: 1, ResultDesc: 'Invalid callback' });
  }
  
  const callback = Body.stkCallback;
  const resultCode = callback.ResultCode;
  const checkoutRequestId = callback.CheckoutRequestID;
  
  // Store result in database or cache (e.g., Upstash Redis)
  // For now, we'll use a simple in-memory store (resets on cold start)
  global.mpesaResults = global.mpesaResults || {};
  global.mpesaResults[checkoutRequestId] = {
    status: resultCode === 0 ? 'success' : 'failed',
    resultCode: resultCode,
    resultDesc: callback.ResultDesc,
    metadata: callback.CallbackMetadata?.Item || [],
    timestamp: new Date().toISOString()
  };
  
  console.log('M-Pesa callback received:', checkoutRequestId, resultCode);
  
  res.json({ ResultCode: 0, ResultDesc: 'Success' });
};
