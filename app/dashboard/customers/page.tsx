import { Metadata } from 'next';

import { fetchFilteredCustomers } from '@/app/lib/data';
import { formatCurrency } from '@/app/lib/utils';
import CustomersTable from '@/app/ui/customers/table';

export const metadata: Metadata = {
  title: 'Customers',
};

export default async function Page({
  searchParams,
}: {
  searchParams?: {
    query?: string;
    page?: string;
  };
}) {
  const query = searchParams?.query || '';

  const customers = await fetchFilteredCustomers(query);

  const formattedCustomers = customers.map((customer) => ({
    ...customer,
    total_pending: formatCurrency(customer.total_pending),
    total_paid: formatCurrency(customer.total_paid),
  }));

  return (
    <main>
      <CustomersTable customers={formattedCustomers} />
    </main>
  );
}
