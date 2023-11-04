const { invoices, customers, revenue, users } = require('../app/lib/placeholder-data.js');
const db = require('./db.js');

const bcrypt = require('bcrypt');

let customerObjectIds = [];

async function seedUsers() {
  try {
    // Insert data into the "users" table
    const insertedUsers = await Promise.all(
      users.map(async (user) => {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        return db.Users.create({
          name: user.name,
          email: user.email,
          password: hashedPassword,
        });
      })
    );

    console.log(`Seeded ${insertedUsers.length} users`);
    return insertedUsers;
  } catch (error) {
    console.error('Error seeding users:', error);
    throw error;
  }
}

async function seedCustomers() {
  try {
    // Insert data into the "customers" table
    const insertedCustomers = await Promise.all(
      customers.map(async (customer) => {
        const dbCustomer = await db.Customers.create({
          name: customer.name,
          email: customer.email,
          image_url: customer.image_url,
        });
        customerObjectIds[customer.id] = dbCustomer._id;
      })
    );

    console.log(`Seeded ${insertedCustomers.length} customers`);
    return insertedCustomers;
  } catch (error) {
    console.error('Error seeding customers:', error);
    throw error;
  }
}

async function seedInvoices() {
  try {
    // Insert data into the "invoices" table
    const insertedInvoices = await Promise.all(
      invoices.map((invoice) =>
        db.Invoices.create({
          customer_id: customerObjectIds[invoice.customer_id],
          amount: invoice.amount,
          status: invoice.status,
          date: invoice.date,
        })
      )
    );

    console.log(`Seeded ${insertedInvoices.length} invoices`);
    return insertedInvoices;
  } catch (error) {
    console.error('Error seeding invoices:', error);
    throw error;
  }
}

async function seedRevenue() {
  try {
    // Insert data into the "revenue" table
    const insertedRevenue = await Promise.all(
      revenue.map((rev) => db.Revenues.create({ month: rev.month, revenue: rev.revenue }))
    );

    console.log(`Seeded ${insertedRevenue.length} revenue`);

    return insertedRevenue;
  } catch (error) {
    console.error('Error seeding revenue:', error);
    throw error;
  }
}

(async () => {
  await seedUsers();
  await seedCustomers();
  await seedInvoices();
  await seedRevenue();
  await db.disconnect();
})();
