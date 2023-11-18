import { Metadata } from 'next';
import React from 'react';

import { fetchCustomers } from '@/app/lib/data';
import Breadcrumbs from '@/app/ui/invoices/breadcrumbs';
import CreateInvoiceForm from '@/app/ui/invoices/create-form';

export const metadata: Metadata = {
  title: 'Create Invoice',
};

export default async function CreateInvoicePage() {
  const customers = await fetchCustomers();

  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: 'Invoices', href: '/dashboard/invoices' },
          {
            label: 'Create Invoice',
            href: '/dashboard/invoices/create',
            active: true,
          },
        ]}
      />
      <CreateInvoiceForm customers={customers} />
    </main>
  );
}
