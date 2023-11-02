import { Schema, model, models } from 'mongoose';

// TODO interface siehe https://github.com/vercel/next.js/blob/canary/examples/with-mongodb-mongoose/models/Pet.ts
const InvoicesSchema = new Schema(
  {
    customer_id: {
      type: Schema.Types.UUID,
      ref: 'Customers',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      required: true,
    },
    date: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },
  },
  {
    autoCreate: true,
    timestamps: true,
  }
);

const Invoices = models.Invoices || model('Invoices', InvoicesSchema);

export default Invoices;
