import { Type, type FunctionDeclaration } from "@google/genai";

const BACKEND_URL = "http://localhost:3001";

export const listProductsDeclaration: FunctionDeclaration = {
  name: "list_products",
  description: "Lists products from the catalog, paginated.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      page: { type: Type.INTEGER, description: "Page number, starting at 1. Defaults to 1." },
      limit: { type: Type.INTEGER, description: "Items per page, max 100. Defaults to 10." },
    },
  },
};

export async function listProducts(args: Record<string, unknown>): Promise<Record<string, unknown>> {
  const page = typeof args.page === "number" ? args.page : 1;
  const limit = typeof args.limit === "number" ? args.limit : 10;

  const res = await fetch(`${BACKEND_URL}/products?page=${page}&limit=${limit}`);
  if (!res.ok) return { error: `Backend returned ${res.status}` };
  return res.json();
}

export const getProductDeclaration: FunctionDeclaration = {
  name: "get_product",
  description: "Gets a single product by its id.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING, description: "The product's UUID." },
    },
    required: ["id"],
  },
};

export async function getProduct(args: Record<string, unknown>): Promise<Record<string, unknown>> {
  const id = String(args.id);
  const res = await fetch(`${BACKEND_URL}/products/${id}`);
  if (!res.ok) return { error: `Backend returned ${res.status}` };
  return res.json();
}
