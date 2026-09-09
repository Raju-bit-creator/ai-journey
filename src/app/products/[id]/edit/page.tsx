import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import EditProductForm from './edit-product-form';

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  createdAt: string;
  owner: { id: string; name: string; email: string } | null;
};

async function getProduct(id: string): Promise<Product | null> {
  const res = await fetch(`${process.env.BACKEND_URL}/products/${id}`, {
    cache: 'no-store',
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Failed to load product');
  return res.json();
}

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, user] = await Promise.all([
    getProduct(id),
    getCurrentUser(),
  ]);

  if (!product) {
    notFound();
  }

  const canEdit = !!user && (!product.owner || product.owner.id === user.id);
  if (!canEdit) {
    redirect('/products');
  }

  return (
    <div className="flex flex-col flex-1 items-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-3xl flex-1 flex-col gap-10 px-6 py-24 sm:px-10">
        <div className="flex flex-col gap-3">
          <span className="text-sm font-medium tracking-wide text-zinc-500 dark:text-zinc-400">
            Backend · NestJS + PostgreSQL
          </span>
          <h1 className="text-3xl font-semibold tracking-tight text-black sm:text-4xl dark:text-zinc-50">
            Edit product
          </h1>
        </div>

        <EditProductForm product={product} />
      </main>
    </div>
  );
}
