import { Schema, Types } from 'mongoose';
import { unstable_noStore as noStore } from 'next/cache';

import { connectToDb } from '@/app/lib/db';
import {
  CustomerField,
  CustomersTable,
  InvoiceForm,
  InvoicesTable,
  LatestInvoiceRaw,
  Revenue,
  User,
} from '@/app/lib/definitions';
import { MONGO_DATE_FORMAT } from '@/app/lib/utils';
import Customers from '@/app/models/customers';
import Invoices from '@/app/models/invoices';
import Revenues from '@/app/models/revenues';
import Users from '@/app/models/users';

type MongoGroupSum = {
  _id: string;
  sum: number;
};

type MongoCount = { count: number };

type LeanDocument = { _id: Schema.Types.ObjectId };

function objectIdToString(leanDocs: LeanDocument[]) {
  return leanDocs.map((leanDoc) => ({
    ...leanDoc,
    _id: leanDoc._id.toString(),
  }));
}

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
    // TODO order by month, worked in SQL because it was just inserted in correct order :)
    const revenues = await Revenues.find().lean().select(['month', 'revenue']).exec();
    // TODO mapping definitions.Revenue and models.Revenues

    console.log('Data fetch complete after 3 seconds.');

    return objectIdToString(revenues) as Revenue[];
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch revenue data.');
  }
}

export async function fetchLatestInvoices() {
  await connectToDb();
  noStore();

  try {
    // TODO type of aggregate()?
    const invoices = await Invoices.aggregate([
      {
        $lookup: {
          from: Customers.collection.name,
          localField: 'customer_id',
          foreignField: '_id',
          as: 'customer',
        },
      },
      {
        $unwind: '$customer',
      },
      {
        $sort: { date: -1 },
      },
      {
        $project: {
          _id: 1,
          customer: 1,
          amount: 1,
        },
      },
    ])
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

    return objectIdToString(invoices) as LatestInvoiceRaw[];
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch the latest invoices.');
  }
}

export async function fetchCardData() {
  await connectToDb();
  noStore();

  try {
    const invoicesCountPromise: Promise<number> = Invoices.countDocuments().exec();
    const customersCountPromise: Promise<number> = Customers.countDocuments().exec();
    const invoicesTotalsPromise: Promise<MongoGroupSum[]> = Invoices.aggregate([
      { $group: { _id: '$status', sum: { $sum: '$amount' } } },
    ]);

    const [numberOfInvoices, numberOfCustomers, totals] = await Promise.all([
      invoicesCountPromise,
      customersCountPromise,
      invoicesTotalsPromise,
    ]);
    const totalPaidInvoices = totals.find((group) => group._id === 'paid')?.sum ?? 0;
    const totalPendingInvoices = totals.find((group) => group._id === 'pending')?.sum ?? 0;

    return {
      numberOfInvoices,
      numberOfCustomers,
      totalPaidInvoices,
      totalPendingInvoices,
    };
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch card data.');
  }
}

/**
 * Returns $lookup stage for aggregation pipeline to search for invoices.
 *
 * @param query to search case insensitive for in customer name, email or invoice amount/date/status
 * @returns invoices matching query
 */
function getInvoicesLookup(query: string) {
  const queryLower = query?.toLowerCase();
  return {
    $lookup: {
      from: Customers.collection.name,
      localField: 'customer_id',
      foreignField: '_id',
      let: {
        invoice_amount: { $toString: '$amount' }, // TODO decimal point
        invoice_date: { $dateToString: { format: MONGO_DATE_FORMAT, date: '$date' } },
        invoice_status: '$status',
      },
      pipeline: [
        {
          $match: {
            $expr: {
              $or: [
                { $gte: [{ $indexOfCP: [{ $toLower: '$name' }, queryLower] }, 0] },
                { $gte: [{ $indexOfCP: [{ $toLower: '$email' }, queryLower] }, 0] },
                { $gte: [{ $indexOfCP: ['$$invoice_amount', queryLower] }, 0] },
                { $gte: [{ $indexOfCP: [{ $toLower: '$$invoice_date' }, queryLower] }, 0] },
                { $gte: [{ $indexOfCP: ['$$invoice_status', queryLower] }, 0] }, // no need to lower case as status is already lower cased
              ],
            },
          },
        },
      ],
      as: 'customer',
    },
  };
}

export async function fetchFilteredInvoices(query: string, currentPage: number, itemsPerPage: number) {
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
    const invoices = await Invoices.aggregate([
      getInvoicesLookup(query),
      {
        $unwind: '$customer',
      },
      {
        $sort: { date: -1 },
      },
      {
        $project: {
          _id: 1,
          customer: 1,
          date: 1,
          amount: 1,
          status: 1,
        },
      },
    ])
      .skip((currentPage - 1) * itemsPerPage)
      .limit(itemsPerPage)
      .exec();

    return objectIdToString(invoices) as InvoicesTable[];
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
    const counts: MongoCount[] = await Invoices.aggregate([
      getInvoicesLookup(query),
      {
        $unwind: '$customer',
      },
      {
        $count: 'count',
      },
    ]).exec();

    return counts[0]?.count || 0;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch total number of invoices.');
  }
}

export async function fetchInvoiceById(id: string) {
  await connectToDb();
  noStore();

  try {
    /*
    const data = await sql<InvoiceForm>`
      SELECT
        invoices.id,
        invoices.customer_id,
        invoices.amount,
        invoices.status
      FROM invoices
      WHERE invoices.id = ${id};
    `;
    */
    const invoice = await Invoices.findById(id).lean().select(['customer_id', 'amount', 'status']).exec();
    if (!invoice) return undefined;

    return {
      ...invoice,
      _id: invoice._id.toString(),
      customer_id: invoice.customer_id.toString(),
      amount: invoice.amount / 100,
    } as InvoiceForm;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoice.');
  }
}

export async function fetchCustomers() {
  await connectToDb();
  noStore();

  try {
    /*
    const data = await sql<CustomerField>`
      SELECT
        id,
        name
      FROM customers
      ORDER BY name ASC
    `;
    */
    const customers = await Customers.find().lean().select('name').sort({ name: 1 }).exec();

    return objectIdToString(customers) as CustomerField[];
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch all customers.');
  }
}

export async function fetchFilteredCustomers(query: string) {
  await connectToDb();
  noStore();

  try {
    /*
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
    */

    const queryLower = query?.toLowerCase();

    const customers = await Customers.aggregate([
      {
        $lookup: {
          from: Invoices.collection.name,
          localField: '_id',
          foreignField: 'customer_id',
          let: {
            customer_name: '$name',
            customer_email: '$email',
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    { $gte: [{ $indexOfCP: ['$$customer_name', queryLower] }, 0] },
                    { $gte: [{ $indexOfCP: ['$$customer_email', queryLower] }, 0] },
                  ],
                },
              },
            },
          ],
          as: 'invoice',
        },
      },
      {
        $unwind: '$invoice',
      },
      {
        $group: {
          _id: {
            _id: '$_id',
            name: '$name',
            email: '$email',
            image_url: '$image_url',
          },
          total_invoices: { $count: {} },
          total_pending: {
            $sum: {
              $cond: [{ $eq: ['$invoice.status', 'pending'] }, '$invoice.amount', 0],
            },
          },
          total_paid: {
            $sum: {
              $cond: [{ $eq: ['$invoice.status', 'paid'] }, '$invoice.amount', 0],
            },
          },
        },
      },
      {
        $replaceWith: {
          $mergeObjects: [
            '$_id',
            { total_invoices: '$total_invoices', total_pending: '$total_pending', total_paid: '$total_paid' },
          ],
        },
      },
      {
        $sort: { name: 1 },
      },
    ])
      //.skip((currentPage - 1) * itemsPerPage)
      //.limit(itemsPerPage)
      .exec();

    return objectIdToString(customers) as CustomersTable[];
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch customer table.');
  }
}

export async function fetchUserByEmail(email: string) {
  await connectToDb();
  noStore();

  try {
    // TODO should be case insensitive
    const user = await Users.findOne({ email: email }).lean().select(['name', 'email', 'password']).exec();
    if (!user) return undefined;

    return {
      ...user,
      _id: user._id.toString(),
    } as User;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch user.');
  }
}

export async function createInvoice(customerId: string, amount: number, status: string, date: Date) {
  await connectToDb();
  noStore();

  try {
    return Invoices.create([{ customer_id: new Types.ObjectId(customerId), amount, status, date }]);
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to create invoice.');
  }
}

export async function updateInvoice(id: string, customerId: string, amount: number, status: string) {
  await connectToDb();
  noStore();

  try {
    return Invoices.updateOne(
      { _id: new Types.ObjectId(id) },
      { customer_id: new Types.ObjectId(customerId), amount, status }
    );
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to update invoice.');
  }
}

export async function deleteInvoice(id: string) {
  await connectToDb();
  noStore();

  try {
    return Invoices.findByIdAndDelete(id);
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to delete invoice.');
  }
}
