const {
  invoices,
  customers,
  revenue,
  users,
} = require('../app/lib/placeholder-data.js');
const db = require('./db.js');

const bcrypt = require('bcrypt');

async function seedUsers() {
  try {
    // Insert data into the "users" table
    // TODO remove id
    const insertedUsers = await Promise.all(
      users.map(async (user) => {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        return db.Users.create({
          id: user.id,
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

async function seedInvoices() {
  try {
    // Insert data into the "invoices" table
    // TODO don't use customer_id as foreign key, but rather MongoDB's own id
    const insertedInvoices = await Promise.all(
      invoices.map((invoice) =>
        db.Invoices.create({
          customer_id: invoice.customer_id,
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

async function seedCustomers() {
  try {
    // Insert data into the "customers" table
    // TODO remove id
    const insertedCustomers = await Promise.all(
      customers.map((customer) =>
        db.Customers.create({
          id: customer.id,
          name: customer.name,
          email: customer.email,
          image_url: customer.image_url,
        })
      )
    );

    console.log(`Seeded ${insertedCustomers.length} customers`);

    return insertedCustomers;
  } catch (error) {
    console.error('Error seeding customers:', error);
    throw error;
  }
}

async function seedRevenue() {
  try {
    // Insert data into the "revenue" table
    const insertedRevenue = await Promise.all(
      revenue.map((rev) =>
        db.Revenues.create({ month: rev.month, revenue: rev.revenue })
      )
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
