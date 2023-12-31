import { Metadata } from 'next';
import { Suspense } from 'react';

import { fetchFilteredInvoicesCount } from '@/app/lib/data';
import { lusitana } from '@/app/ui/fonts';
import { CreateInvoice } from '@/app/ui/invoices/buttons';
import Pagination from '@/app/ui/invoices/pagination';
import Table from '@/app/ui/invoices/table';
import Search from '@/app/ui/search';
import { InvoicesTableSkeleton } from '@/app/ui/skeletons';

export const metadata: Metadata = {
  title: 'Invoices',
};

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams?: {
    query?: string;
    page?: string;
  };
}) {
  const query = searchParams?.query || '';
  const currentPage = Number(searchParams?.page) || 1;
  const itemsPerPage = 6;

  const totalItems = await fetchFilteredInvoicesCount(query);

  return (
    <div className="w-full">
      <div className="flex w-full items-center justify-between">
        <h1 className={`${lusitana.className} text-2xl`}>Invoices</h1>
      </div>
      <div className="mt-4 flex items-center justify-between gap-2 md:mt-8">
        <Search placeholder="Search invoices ..." />
        <CreateInvoice />
      </div>
      <Suspense key={query + '-' + currentPage + '-' + itemsPerPage} fallback={<InvoicesTableSkeleton />}>
        <Table query={query} currentPage={currentPage} itemsPerPage={itemsPerPage} />
      </Suspense>
      <div className="mt-5 flex w-full justify-center">
        <Pagination itemsPerPage={itemsPerPage} totalItems={totalItems} />
      </div>
    </div>
  );
}
