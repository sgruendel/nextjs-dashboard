import { Schema, model, models } from 'mongoose';

// TODO interface siehe https://github.com/vercel/next.js/blob/canary/examples/with-mongodb-mongoose/models/Pet.ts
const RevenuesSchema = new Schema(
  {
    month: {
      type: String,
      required: true,
      match: /^[A-z][a-z]{2}$/,
    },
    revenue: {
      type: Number,
      required: true,
    },
  },
  {
    autoCreate: true,
    timestamps: true,
  }
);

/*
transactions.index({ isin: 1, date: -1, time: -1 }, { unique: true });
transactions.index({ isin: 1, date: -1, id: -1 }, { unique: true });
exports.Transactions = mongoose.model('Transactions', transactions);
*/

const Revenues = models.Revenues || model('Revenues', RevenuesSchema);

export default Revenues;
