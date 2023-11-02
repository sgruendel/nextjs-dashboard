import { unstable_noStore as noStore } from 'next/cache';
import {
  CustomerField,
  CustomersTable,
  InvoiceForm,
  InvoicesTable,
  User,
  Revenue,
  LatestInvoice,
} from './definitions';
import { formatCurrency } from './utils';
import { connectToDb } from './db';

import Customers from '../models/customers';
import Invoices from '../models/invoices';
import Revenues from '../models/revenues';

type MongoGroupSum = {
  _id: any;
  sum: number;
};

type MongoCount = { count: number };

export async function fetchRevenue() {
  await connectToDb();
  noStore();
  // Add noStore() here prevent the response from being cached.
  // This is equivalent to in fetch(..., {cache: 'no-store'}).

  try {
    // Artificially delay a reponse for demo purposes.
    // Don't do this in real life :)

    console.log('Fetching revenue data...');
    await new Promise((resolve) => setTimeout(resolve, 3000));

    //const data = await sql<Revenue>`SELECT * FROM revenue`;
    const data: Revenue[] = await Revenues.find().exec();
    // TODO mapping definitions.Revenue and models.Revenues

    console.log('Data fetch complete after 3 seconds.');

    return data;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch revenue data.');
  }
}

export async function fetchLatestInvoices() {
  await connectToDb();
  noStore();

  try {
    //const invoices = await Invoices.find().sort({date: -1}).limit(5).exec();
    // TODO type of aggregate()?
    const invoices = await Invoices.aggregate([
      {
        $lookup: {
          from: Customers.collection.name,
          localField: 'customer_id',
          foreignField: 'id', // TODO should be _id when using MongoDB's ids
          as: 'customer',
        },
      },
      {
        $unwind: '$customer',
      },
      {
        $project: {
          _id: 1,
          'customer.name': 1,
          'customer.image_url': 1,
          'customer.email': 1,
          amount: 1,
        },
      },
    ])
      .sort({ date: -1 })
      .limit(5)
      .exec();
    /*
    const data = await sql<LatestInvoiceRaw>`
      SELECT invoices.amount, customers.name, customers.image_url, customers.email, invoices.id
      FROM invoices
      JOIN customers ON invoices.customer_id = customers.id
      ORDER BY invoices.date DESC
      LIMIT 5`;
      */

    // TODO type LatestInvoice should be sth. like InvoiceWithCustomer
    // TODO don't format amount here, do it in .tsx like ui/invoices/table.tsx
    const latestInvoices: LatestInvoice[] = invoices.map((invoice) => ({
      ...invoice,
      amount: formatCurrency(invoice.amount),
    }));
    return latestInvoices;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch the latest invoices.');
  }
}

export async function fetchCardData() {
  await connectToDb();
  noStore();

  try {
    // You can probably combine these into a single SQL query
    // However, we are intentionally splitting them to demonstrate
    // how to initialize multiple queries in parallel with JS.
    const invoiceCountPromise: Promise<number> =
      Invoices.countDocuments().exec();
    const customerCountPromise: Promise<number> =
      Customers.countDocuments().exec();
    const invoiceStatusPromise: Promise<MongoGroupSum[]> = Invoices.aggregate([
      { $group: { _id: '$status', sum: { $sum: '$amount' } } },
    ]);

    const data = await Promise.all([
      invoiceCountPromise,
      customerCountPromise,
      invoiceStatusPromise,
    ]);

    const numberOfInvoices = data[0];
    const numberOfCustomers = data[1];
    // TODO don't format here, do it in .tsx
    const totalPaidInvoices = formatCurrency(
      data[2].find((group) => group._id === 'paid')?.sum ?? 0
    );
    const totalPendingInvoices = formatCurrency(
      data[2].find((group) => group._id === 'pending')?.sum ?? 0
    );

    return {
      numberOfCustomers,
      numberOfInvoices,
      totalPaidInvoices,
      totalPendingInvoices,
    };
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch card data.');
  }
}

function getInvoicesLookup(query: string) {
  return {
    $lookup: {
      from: Customers.collection.name,
      localField: 'customer_id',
      foreignField: 'id', // TODO should be _id when using MongoDB's ids
      let: {
        name: { $toLower: '$name' },
        email: { $toLower: '$email' },
        amount: { $toString: '$amount' }, // TODO decimal point
        date: '$date', // TODO $dateToString if proper date object, otherwise convert to display format
        status: '$status',
      },
      pipeline: [
        {
          $match: {
            $expr: {
              $or: [
                { $gte: [{ $indexOfCP: ['$name', query] }, 0] },
                { $gte: [{ $indexOfCP: ['$email', query] }, 0] },
                { $gte: [{ $indexOfCP: ['$$amount', query] }, 0] },
                { $gte: [{ $indexOfCP: ['$$date', query] }, 0] },
                { $gte: [{ $indexOfCP: ['$$status', query] }, 0] },
              ],
            },
          },
        },
      ],
      as: 'customer',
    },
  };
}

export async function fetchFilteredInvoices(
  query: string,
  currentPage: number,
  itemsPerPage: number
) {
  await connectToDb();
  noStore();

  try {
    /*
    const invoices = await sql<InvoicesTable>`
      SELECT
        invoices.id,
        invoices.amount,
        invoices.date,
        invoices.status,
        customers.name,
        customers.email,
        customers.image_url
      FROM invoices
      JOIN customers ON invoices.customer_id = customers.id
      WHERE
        customers.name ILIKE ${`%${query}%`} OR
        customers.email ILIKE ${`%${query}%`} OR
        invoices.amount::text ILIKE ${`%${query}%`} OR
        invoices.date::text ILIKE ${`%${query}%`} OR
        invoices.status ILIKE ${`%${query}%`}
      ORDER BY invoices.date DESC
      LIMIT ${ITEMS_PER_PAGE} OFFSET ${offset}
    `;
    */

    // filter date/status
    const invoices: InvoicesTable[] = await Invoices.aggregate([
      getInvoicesLookup(query),
      {
        $unwind: '$customer',
      },
      {
        $project: {
          _id: 1,
          'customer.name': 1,
          'customer.image_url': 1,
          'customer.email': 1,
          date: 1,
          amount: 1,
          status: 1,
        },
      },
    ])
      .sort({ date: -1 })
      .skip((currentPage - 1) * itemsPerPage)
      .limit(itemsPerPage)
      .exec();

    return invoices;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoices.');
  }
}

export async function fetchFilteredInvoicesCount(query: string) {
  await connectToDb();
  noStore();

  try {
    /*
    const count = await sql`SELECT COUNT(*)
    FROM invoices
    JOIN customers ON invoices.customer_id = customers.id
    WHERE
      customers.name ILIKE ${`%${query}%`} OR
      customers.email ILIKE ${`%${query}%`} OR
      invoices.amount::text ILIKE ${`%${query}%`} OR
      invoices.date::text ILIKE ${`%${query}%`} OR
      invoices.status ILIKE ${`%${query}%`}
  `;
    */
    // TODO Refactor to use same query as above
    const counts: MongoCount[] = await Invoices.aggregate([
      getInvoicesLookup(query),
      {
        $unwind: '$customer',
      },
      {
        $count: 'count',
      },
    ]).exec();

    return counts[0].count;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch total number of invoices.');
  }
}

export async function fetchInvoiceById(id: string) {
  await connectToDb();
  noStore();

  try {
    const data = await sql<InvoiceForm>`
      SELECT
        invoices.id,
        invoices.customer_id,
        invoices.amount,
        invoices.status
      FROM invoices
      WHERE invoices.id = ${id};
    `;

    const invoice = data.rows.map((invoice) => ({
      ...invoice,
      // Convert amount from cents to dollars
      amount: invoice.amount / 100,
    }));

    return invoice[0];
  } catch (error) {
    console.error('Database Error:', error);
  }
}

export async function fetchCustomers() {
  await connectToDb();
  noStore();

  try {
    const data = await sql<CustomerField>`
      SELECT
        id,
        name
      FROM customers
      ORDER BY name ASC
    `;

    const customers = data.rows;
    return customers;
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch all customers.');
  }
}

export async function fetchFilteredCustomers(query: string) {
  await connectToDb();
  noStore();

  try {
    const data = await sql<CustomersTable>`
		SELECT
		  customers.id,
		  customers.name,
		  customers.email,
		  customers.image_url,
		  COUNT(invoices.id) AS total_invoices,
		  SUM(CASE WHEN invoices.status = 'pending' THEN invoices.amount ELSE 0 END) AS total_pending,
		  SUM(CASE WHEN invoices.status = 'paid' THEN invoices.amount ELSE 0 END) AS total_paid
		FROM customers
		LEFT JOIN invoices ON customers.id = invoices.customer_id
		WHERE
		  customers.name ILIKE ${`%${query}%`} OR
        customers.email ILIKE ${`%${query}%`}
		GROUP BY customers.id, customers.name, customers.email, customers.image_url
		ORDER BY customers.name ASC
	  `;

    const customers = data.rows.map((customer) => ({
      ...customer,
      total_pending: formatCurrency(customer.total_pending),
      total_paid: formatCurrency(customer.total_paid),
    }));

    return customers;
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch customer table.');
  }
}

export async function getUser(email: string) {
  await connectToDb();
  noStore();

  try {
    const user = await sql`SELECT * from USERS where email=${email}`;
    return user.rows[0] as User;
  } catch (error) {
    console.error('Failed to fetch user:', error);
    throw new Error('Failed to fetch user.');
  }
}
