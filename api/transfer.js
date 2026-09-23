const store = require('./_store');

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: "Только POST" });

  const { fromId, toId, amount, comment } = req.body;

  if (!fromId || !toId || !amount)
    return res.status(400).json({ error: "Не все поля заполнены" });

  const from = store.users[fromId];
  const to = store.users[toId];
  if (!from || !to) return res.status(404).json({ error: "Пользователь не найден" });

  const sum = Number(amount);
  if (sum <= 0) return res.status(400).json({ error: "Сумма должна быть больше 0" });
  if (from.balance < sum) return res.status(400).json({ error: "Недостаточно средств" });

  from.balance -= sum;
  to.balance += sum;

  const now = new Date().toISOString();
  store.transactions.push(
    {
      id: Date.now(),
      userId: fromId,
      type: "out",
      to: to.name,
      amount: sum,
      comment: comment || "Перевод",
      date: now
    },
    {
      id: Date.now() + 1,
      userId: toId,
      type: "in",
      from: from.name,
      amount: sum,
      comment: comment || "Перевод",
      date: now
    }
  );

  return res.status(200).json({
    success: true,
    message: `Переведено ${sum} ₸ → ${to.name}`,
    newBalance: from.balance
  });
};