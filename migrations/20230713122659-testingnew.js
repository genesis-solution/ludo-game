module.exports = {
  async up(db, client) {
    await db
      .collection("transactions")
      .updateMany({}, { $set: { test: null, testType: { $type: "number" } } });
  },

  async down(db, client) {
    await db
      .collection("transactions")
      .updateMany({}, { $unset: { test: null }, $unset: { testType: null } });
  },
};
