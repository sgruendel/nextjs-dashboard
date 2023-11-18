'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

import {
  createInvoice as createInvoiceData,
  deleteInvoice as deleteInvoiceData,
  updateInvoice as updateInvoiceData,
} from '@/app/lib/data';

const InvoiceSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amount: z.coerce.number(),
  status: z.enum(['pending', 'paid']),
  date: z.string(),
});

const CreateInvoice = InvoiceSchema.omit({ id: true, date: true });

const UpdateInvoice = InvoiceSchema.omit({ id: true, date: true });

export async function createInvoice(formData: FormData) {
  const { customerId, amount, status } = CreateInvoice.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });
  const amountInCents = amount * 100;
  const date = new Date().toISOString().split('T')[0];

  try {
    createInvoiceData(customerId, amountInCents, status, date);
  } catch (err) {
    return { message: 'db error: Failed to create invoice' };
  }
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function updateInvoice(id: string, formData: FormData) {
  const { customerId, amount, status } = UpdateInvoice.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  const amountInCents = amount * 100;
  try {
    updateInvoiceData(id, customerId, amountInCents, status);
  } catch (err) {
    return { message: 'db error: Failed to update invoice' };
  }

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {
  try {
    deleteInvoiceData(id);
  } catch (err) {
    return { message: 'db error: Failed to delete invoice' };
  }
  revalidatePath('/dashboard/invoices');
  return { message: 'Deleted Invoice.' };
}
