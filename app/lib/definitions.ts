// This file contains type definitions for your data.
// It describes the shape of the data, and what data type each property should accept.
// For simplicity of teaching, we're manually defining these types.
// However, these types are generated automatically if you're using an ORM such as Prisma.

// TODO duplicated in models/*.ts for MongoDB
export type User = {
  _id: string;
  name: string;
  email: string;
  password: string;
};

export type Customer = {
  _id: string;
  name: string;
  email: string;
  image_url: string;
};

export type Invoice = {
  _id: string;
  customer_id: string;
  amount: number;
  date: string;
  // In TypeScript, this is called a string union type.
  // It means that the "status" property can only be one of the two strings: 'pending' or 'paid'.
  status: 'pending' | 'paid';
};

export type Revenue = {
  month: string;
  revenue: number;
};

type CustomerInvoice = {
  name: string;
  email: string;
  image_url: string;
};

export type LatestInvoice = {
  _id: string;
  customer: CustomerInvoice;
  //TODO alternative: customer: Omit<Customer, "_id">;
  amount: string;
};

// The database returns a number for amount, but we later format it to a string with the formatCurrency function
// TODO don't need for mongoDB
export type LatestInvoiceRaw = Omit<LatestInvoice, 'amount'> & {
  amount: number;
};

// TODO rename type
export type InvoicesTable = {
  _id: string;
  //customer_id: string;
  customer: CustomerInvoice;
  //name: string;
  //email: string;
  //image_url: string;
  date: string;
  amount: number;
  status: 'pending' | 'paid';
};

export type CustomersTable = {
  id: string;
  name: string;
  email: string;
  image_url: string;
  total_invoices: number;
  total_pending: number;
  total_paid: number;
};

export type FormattedCustomersTable = {
  id: string;
  name: string;
  email: string;
  image_url: string;
  total_invoices: number;
  total_pending: string;
  total_paid: string;
};

export type CustomerField = {
  id: string;
  name: string;
};

export type InvoiceForm = {
  id: string;
  customer_id: string;
  amount: number;
  status: 'pending' | 'paid';
};
