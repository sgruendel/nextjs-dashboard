'use client';

import { ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

import { generatePagination } from '@/app/lib/utils';

export default function Pagination({ itemsPerPage, totalItems }: { itemsPerPage: number; totalItems: number }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentPage = Number(searchParams.get('page')) || 1;

  const createPageURL = (pageNumber: number | string) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', pageNumber.toString());
    return `${pathname}?${params.toString()}`;
  };

  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, totalItems);

  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const pagination = generatePagination(currentPage, totalPages);

  return (
    <div className="inline-flex">
      {totalItems > 0 && (
        <div className="mr-2 flex items-center justify-center text-xs md:mr-4">
          {startIndex}-{endIndex} of {totalItems}
        </div>
      )}
      <PaginationArrow direction="left" href={createPageURL(currentPage - 1)} isDisabled={currentPage <= 1} />

      <div className="flex -space-x-px">
        {pagination.map((page, index) => {
          let position: 'first' | 'last' | 'single' | 'middle' | undefined;

          if (index === 0) position = 'first';
          if (index === pagination.length - 1) position = 'last';
          if (pagination.length === 1) position = 'single';
          if (page === '...') position = 'middle';

          return (
            <PaginationNumber
              key={page}
              href={createPageURL(page)}
              page={page}
              position={position}
              isActive={currentPage === page}
            />
          );
        })}
      </div>

      <PaginationArrow direction="right" href={createPageURL(currentPage + 1)} isDisabled={currentPage >= totalPages} />
    </div>
  );
}

function PaginationNumber({
  page,
  href,
  isActive,
  position,
}: {
  page: number | string;
  href: string;
  position?: 'first' | 'last' | 'middle' | 'single';
  isActive: boolean;
}) {
  const className = clsx('flex h-10 w-10 items-center justify-center border text-sm', {
    'rounded-l-md': position === 'first' || position === 'single',
    'rounded-r-md': position === 'last' || position === 'single',
    'z-10 bg-blue-600 border-blue-600 text-white': isActive,
    'hover:bg-gray-100': !isActive && position !== 'middle',
    'text-gray-300': position === 'middle',
  });

  return isActive || position === 'middle' ? (
    <div className={className}>{page}</div>
  ) : (
    <Link href={href} className={className}>
      {page}
    </Link>
  );
}

function PaginationArrow({
  href,
  direction,
  isDisabled,
}: {
  href: string;
  direction: 'left' | 'right';
  isDisabled?: boolean;
}) {
  const className = clsx('flex h-10 w-10 items-center justify-center rounded-md border', {
    'pointer-events-none text-gray-300': isDisabled,
    'hover:bg-gray-100': !isDisabled,
    'mr-2 md:mr-4': direction === 'left',
    'ml-2 md:ml-4': direction === 'right',
  });

  const icon = direction === 'left' ? <ArrowLeftIcon className="w-4" /> : <ArrowRightIcon className="w-4" />;

  return isDisabled ? (
    <div className={className}>{icon}</div>
  ) : (
    <Link className={className} href={href}>
      {icon}
    </Link>
  );
}
