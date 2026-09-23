const store = require('./_store');

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const userId = req.query.userId || "user1";

  if (req.method === 'GET') {
    const userTx = store.transactions
      .filter(t => t.userId === userId)
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    const grouped = {};
    userTx.forEach(t => {
      const day = new Date(t.date).toLocaleDateString("ru-RU", {
        day: "numeric", month: "long", year: "numeric"
      });
      if (!grouped[day]) grouped[day] = [];
      grouped[day].push(t);
    });

    const userFiles = store.files.filter(f => f.userId === userId);

    return res.status(200).json({
      transactions: userTx,
      grouped,
      files: userFiles
    });
  }

  if (req.method === 'POST') {
    const { name, size, type } = req.body;
    if (!name) return res.status(400).json({ error: "Нет имени файла" });

    const file = {
      id: Date.now(),
      userId,
      name,
      size: size || 0,
      type: type || "application/octet-stream",
      uploadedAt: new Date().toISOString()
    };
    store.files.push(file);

    return res.status(200).json({ success: true, file });
  }

  return res.status(405).json({ error: "Метод не разрешён" });
};