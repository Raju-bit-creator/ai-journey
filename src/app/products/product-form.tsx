'use client';

import { useActionState, useRef, useEffect } from 'react';
import { createProduct, type CreateProductState } from './actions';

const initialState: CreateProductState = { error: null };

export default function ProductForm() {
  const [state, formAction, pending] = useActionState(
    createProduct,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!pending && state.error === null) {
      formRef.current?.reset();
    }
  }, [pending, state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-4 rounded-xl border border-black/[.08] p-5 dark:border-white/[.145]"
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="name" className="text-sm font-medium">
          Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          className="rounded-md border border-black/[.08] bg-white px-3 py-2 text-sm dark:border-white/[.145] dark:bg-black"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="description" className="text-sm font-medium">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          className="rounded-md border border-black/[.08] bg-white px-3 py-2 text-sm dark:border-white/[.145] dark:bg-black"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="price" className="text-sm font-medium">
          Price
        </label>
        <input
          id="price"
          name="price"
          type="number"
          step="0.01"
          min="0"
          required
          className="rounded-md border border-black/[.08] bg-white px-3 py-2 text-sm dark:border-white/[.145] dark:bg-black"
        />
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-full bg-zinc-950 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200"
      >
        {pending ? 'Creating…' : 'Create product'}
      </button>
    </form>
  );
}
