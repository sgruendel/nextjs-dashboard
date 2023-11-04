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

const Revenues = models.Revenues || model('Revenues', RevenuesSchema);

export default Revenues;
