import { Schema, model, models } from 'mongoose';

import Customers from './customers';

// TODO interface siehe https://github.com/vercel/next.js/blob/canary/examples/with-mongodb-mongoose/models/Pet.ts
const InvoicesSchema = new Schema(
  {
    customer_id: {
      type: Schema.Types.ObjectId,
      ref: Customers.collection.name,
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
      type: Date,
      required: true,
    },
  },
  {
    autoCreate: true,
    timestamps: true,
  }
);

const Invoices = models.Invoices || model('Invoices', InvoicesSchema);

export default Invoices;
