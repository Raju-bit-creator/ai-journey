'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getSessionHeader } from '@/lib/auth';

export type CreateProductState = {
  error: string | null;
};

export type UpdateProductState = {
  error: string | null;
};

export async function createProduct(
  _prevState: CreateProductState,
  formData: FormData,
): Promise<CreateProductState> {
  const name = formData.get('name');
  const description = formData.get('description');
  const price = Number(formData.get('price'));

  if (typeof name !== 'string' || name.trim() === '') {
    return { error: 'Name is required.' };
  }
  if (!Number.isFinite(price) || price < 0) {
    return { error: 'Price must be a non-negative number.' };
  }

  const sessionHeader = await getSessionHeader();
  if (!sessionHeader['x-session-id']) {
    return { error: 'You must be logged in to add a product.' };
  }

  const res = await fetch(`${process.env.BACKEND_URL}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...sessionHeader },
    body: JSON.stringify({
      name,
      description: description || undefined,
      price,
    }),
  });

  if (!res.ok) {
    return { error: 'Failed to create product.' };
  }

  revalidatePath('/products');
  return { error: null };
}

export async function updateProduct(
  id: string,
  _prevState: UpdateProductState,
  formData: FormData,
): Promise<UpdateProductState> {
  const name = formData.get('name');
  const description = formData.get('description');
  const price = Number(formData.get('price'));

  if (typeof name !== 'string' || name.trim() === '') {
    return { error: 'Name is required.' };
  }
  if (!Number.isFinite(price) || price < 0) {
    return { error: 'Price must be a non-negative number.' };
  }

  const res = await fetch(`${process.env.BACKEND_URL}/products/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name,
      description: description || undefined,
      price,
    }),
  });

  if (!res.ok) {
    return { error: 'Failed to update product.' };
  }

  revalidatePath('/products');
  redirect('/products');
}

export async function deleteProduct(formData: FormData): Promise<void> {
  const id = formData.get('id');
  if (typeof id !== 'string') return;

  await fetch(`${process.env.BACKEND_URL}/products/${id}`, {
    method: 'DELETE',
  });

  revalidatePath('/products');
}
