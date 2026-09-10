import { McpServer } from "@modelcontextprotocol/server";
import { StdioServerTransport } from "@modelcontextprotocol/server/stdio";
import { z } from "zod";
import { getProduct, listProducts } from "./tools/products.js";
import { sum } from "./tools/calculator.js";

const server = new McpServer({
  name: "ai-journey-products",
  version: "1.0.0",
});

server.registerTool(
  "list_products",
  {
    description: "Lists products from the ai-journey catalog, paginated.",
    inputSchema: z.object({
      page: z.number().int().min(1).optional().describe("Page number, starting at 1. Defaults to 1."),
      limit: z.number().int().min(1).max(100).optional().describe("Items per page, max 100. Defaults to 10."),
    }),
  },
  async ({ page, limit }) => {
    const result = await listProducts({ page, limit });
    return { content: [{ type: "text", text: JSON.stringify(result) }] };
  },
);

server.registerTool(
  "get_product",
  {
    description: "Gets a single product from the catalog by its id.",
    inputSchema: z.object({
      id: z.string().describe("The product's UUID."),
    }),
  },
  async ({ id }) => {
    const result = await getProduct({ id });
    return { content: [{ type: "text", text: JSON.stringify(result) }] };
  },
);

server.registerTool(
  "sum",
  {
    description: "Adds up a list of numbers and returns the total.",
    inputSchema: z.object({
      numbers: z.array(z.number()).describe("The numbers to add together."),
    }),
  },
  async ({ numbers }) => {
    const result = await sum({ numbers });
    return { content: [{ type: "text", text: JSON.stringify(result) }] };
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("ai-journey MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
