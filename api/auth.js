const store = require('./_store');

const PIN_CODE = "8514";

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: "Только POST" });

  const { pin } = req.body;

  if (!pin) return res.status(400).json({ error: "Введите PIN-код" });
  if (pin !== PIN_CODE) return res.status(401).json({ error: "Неверный PIN-код" });

  return res.status(200).json({
    success: true,
    userId: "user1",
    token: "demo-token-" + Date.now()
  });
};