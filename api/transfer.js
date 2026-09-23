const store = require('./_store');

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const userId = req.query.userId || "user1";
  const user = store.users[userId];
  if (!user) return res.status(404).json({ error: "Пользователь не найден" });

  const others = Object.values(store.users)
    .filter(u => u.id !== userId)
    .map(u => ({ id: u.id, name: u.name, phone: u.phone, avatar: u.avatar }));

  return res.status(200).json({ account: user, others });
};