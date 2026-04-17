module.exports = async (req, res) => {
  const { checkoutRequestId } = req.query;
  
  if (!checkoutRequestId) return res.status(400).json({ error: 'Missing checkoutRequestId' });
  
  // Check stored result
  const result = global.mpesaResults?.[checkoutRequestId];
  
  if (result) {
    res.json({ status: result.status, data: result });
  } else {
    res.json({ status: 'pending' });
  }
};
