if (!global._kaspi) {
  global._kaspi = {
    users: {
      "user1": {
        id: "user1",
        name: "ИВАН ИВАНОВ",
        phone: "+7 777 123 45 67",
        cardNumber: "4400 4301 2345 1234",
        balance: 250000,
        currency: "KZT",
        avatar: "ИИ"
      },
      "user2": {
        id: "user2",
        name: "АЙГУЛЬ СЕРИКОВНА",
        phone: "+7 701 987 65 43",
        cardNumber: "4400 4301 8765 5678",
        balance: 89000,
        currency: "KZT",
        avatar: "АС"
      },
      "user3": {
        id: "user3",
        name: "ДАНИЯР АХМЕТОВ",
        phone: "+7 705 555 33 22",
        cardNumber: "4400 4301 5555 3322",
        balance: 45000,
        currency: "KZT",
        avatar: "ДА"
      }
    },
    transactions: [
      {
        id: 1,
        userId: "user1",
        type: "in",
        from: "АЙГУЛЬ СЕРИКОВНА",
        amount: 15000,
        comment: "За аренду",
        date: new Date(Date.now() - 86400000 * 2).toISOString()
      },
      {
        id: 2,
        userId: "user1",
        type: "out",
        to: "ДАНИЯР АХМЕТОВ",
        amount: 5000,
        comment: "Обед",
        date: new Date(Date.now() - 86400000).toISOString()
      }
    ],
    files: []
  };
}

module.exports = {
  users: global._kaspi.users,
  transactions: global._kaspi.transactions,
  files: global._kaspi.files
};