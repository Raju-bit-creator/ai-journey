'use server';

import { revalidatePath } from 'next/cache';

export type CreateProductState = {
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

  const res = await fetch(`${process.env.BACKEND_URL}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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
