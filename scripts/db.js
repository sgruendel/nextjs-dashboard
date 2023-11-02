const mongoose = require('mongoose');
mongoose.set('strictQuery', false);
mongoose.connect('mongodb://minis12:27017/nextjs-dashboard');

var exports = (module.exports = {});

exports.disconnect = mongoose.disconnect;

// TODO duplicates in db.ts
const users = new mongoose.Schema(
  {
    id: {
      type: mongoose.Schema.Types.UUID,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
  },
  {
    autoCreate: true,
    timestamps: true,
  }
);
users.index({ id: 1 }, { unique: true });
users.index({ email: 1 }, { unique: true });
exports.Users = mongoose.model('Users', users);

const customers = new mongoose.Schema(
  {
    id: {
      type: mongoose.Schema.Types.UUID,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    image_url: {
      type: String,
      required: true,
    },
  },
  {
    autoCreate: true,
    timestamps: true,
  }
);
customers.index({ id: 1 }, { unique: true });
customers.index({ email: 1 });
exports.Customers = mongoose.model('Customers', customers);

const invoices = new mongoose.Schema(
  {
    customer_id: {
      type: mongoose.Schema.Types.UUID,
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
invoices.index({ customer_id: -1 });
invoices.index({ date: -1 }, { unique: true });
exports.Invoices = mongoose.model('Invoices', invoices);

const revenues = new mongoose.Schema(
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
revenues.index({ month: 1 }, { unique: true });
exports.Revenues = mongoose.model('Revenues', revenues);
