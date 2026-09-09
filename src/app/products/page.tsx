import ProductForm from './product-form';

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  createdAt: string;
};

async function getProducts(): Promise<Product[]> {
  const res = await fetch(`${process.env.BACKEND_URL}/products`, {
    cache: 'no-store',
  });
  if (!res.ok) return [];
  return res.json();
}

export default async function ProductsPage() {
  const products = await getProducts();

  return (
    <div className="flex flex-col flex-1 items-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-3xl flex-1 flex-col gap-10 px-6 py-24 sm:px-10">
        <div className="flex flex-col gap-3">
          <span className="text-sm font-medium tracking-wide text-zinc-500 dark:text-zinc-400">
            Backend · NestJS + PostgreSQL
          </span>
          <h1 className="text-3xl font-semibold tracking-tight text-black sm:text-4xl dark:text-zinc-50">
            Products
          </h1>
          <p className="max-w-xl text-base leading-7 text-zinc-600 dark:text-zinc-400">
            Submitting this form calls a Next.js Server Action, which sends
            the data to the NestJS API to be stored in PostgreSQL.
          </p>
        </div>

        <ProductForm />

        <ol className="flex flex-col gap-3">
          {products.length === 0 && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No products yet.
            </p>
          )}
          {products.map((product) => (
            <li
              key={product.id}
              className="flex items-baseline justify-between gap-4 rounded-xl border border-black/[.08] px-5 py-4 dark:border-white/[.145]"
            >
              <div className="flex flex-col gap-1">
                <span className="font-semibold">{product.name}</span>
                {product.description && (
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">
                    {product.description}
                  </span>
                )}
              </div>
              <span className="shrink-0 font-mono text-sm">
                ${product.price.toFixed(2)}
              </span>
            </li>
          ))}
        </ol>
      </main>
    </div>
  );
}
