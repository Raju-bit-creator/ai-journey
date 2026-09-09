import Link from 'next/link';
import ProductForm from './product-form';
import { deleteProduct } from './actions';
import { logoutAction } from '../logout-action';
import { getCurrentUser } from '@/lib/auth';

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  createdAt: string;
  owner: { id: string; name: string; email: string } | null;
};

async function getProducts(): Promise<Product[]> {
  const res = await fetch(`${process.env.BACKEND_URL}/products`, {
    cache: 'no-store',
  });
  if (!res.ok) return [];
  return res.json();
}

export default async function ProductsPage() {
  const [products, user] = await Promise.all([
    getProducts(),
    getCurrentUser(),
  ]);

  return (
    <div className="flex flex-col flex-1 items-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-3xl flex-1 flex-col gap-10 px-6 py-24 sm:px-10">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm font-medium tracking-wide text-zinc-500 dark:text-zinc-400">
              Backend · NestJS + PostgreSQL + Redis sessions
            </span>
            {user ? (
              <div className="flex items-center gap-3 text-sm">
                <span className="text-zinc-600 dark:text-zinc-400">
                  {user.name}
                </span>
                <form action={logoutAction}>
                  <button
                    type="submit"
                    className="font-medium text-zinc-950 hover:underline dark:text-zinc-50"
                  >
                    Log out
                  </button>
                </form>
              </div>
            ) : (
              <div className="flex items-center gap-3 text-sm">
                <Link
                  href="/login"
                  className="font-medium text-zinc-950 hover:underline dark:text-zinc-50"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="font-medium text-zinc-950 hover:underline dark:text-zinc-50"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-black sm:text-4xl dark:text-zinc-50">
            Products
          </h1>
          <p className="max-w-xl text-base leading-7 text-zinc-600 dark:text-zinc-400">
            Submitting this form calls a Next.js Server Action, which sends
            the data to the NestJS API to be stored in PostgreSQL.
          </p>
        </div>

        {user ? (
          <ProductForm />
        ) : (
          <p className="rounded-xl border border-black/[.08] px-5 py-4 text-sm text-zinc-500 dark:border-white/[.145] dark:text-zinc-400">
            <Link href="/login" className="font-medium text-zinc-950 hover:underline dark:text-zinc-50">
              Log in
            </Link>{' '}
            to add a product.
          </p>
        )}

        <ol className="flex flex-col gap-3">
          {products.length === 0 && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No products yet.
            </p>
          )}
          {products.map((product) => (
            <li
              key={product.id}
              className="flex items-center justify-between gap-4 rounded-xl border border-black/[.08] px-5 py-4 dark:border-white/[.145]"
            >
              <div className="flex flex-col gap-1">
                <span className="font-semibold">{product.name}</span>
                {product.description && (
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">
                    {product.description}
                  </span>
                )}
                <span className="text-xs text-zinc-400 dark:text-zinc-500">
                  {product.owner ? `by ${product.owner.name}` : 'unowned'}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-4">
                <span className="font-mono text-sm">
                  ${product.price.toFixed(2)}
                </span>
                <Link
                  href={`/products/${product.id}/edit`}
                  className="text-sm font-medium text-zinc-600 hover:underline dark:text-zinc-400"
                >
                  Edit
                </Link>
                <form action={deleteProduct}>
                  <input type="hidden" name="id" value={product.id} />
                  <button
                    type="submit"
                    className="text-sm font-medium text-red-600 hover:underline dark:text-red-400"
                  >
                    Delete
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ol>
      </main>
    </div>
  );
}
