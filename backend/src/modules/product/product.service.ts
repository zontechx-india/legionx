import { prisma } from "../../config/prisma.js";
import { Prisma } from "../../generated/prisma/client.js";
import { slugify } from "../../utils/slug.js";
import { buildListMeta } from "../../utils/response.js";
import { HttpError } from "../../utils/httpError.js";
import type {
  ProductCreateInput,
  ProductUpdateInput,
  ProductListQuery,
} from "./product.schema.js";

type ImageInput = NonNullable<ProductCreateInput["images"]>[number];

const listSelect = {
  id: true,
  name: true,
  slug: true,
  sku: true,
  brand: true,
  price: true,
  discountPrice: true,
  stockQuantity: true,
  status: true,
  isFeatured: true,
  categoryId: true,
  createdAt: true,
  category: { select: { id: true, name: true, slug: true } },
  images: {
    orderBy: [{ isCover: "desc" }, { displayOrder: "asc" }],
    take: 1,
    select: { url: true, isCover: true },
  },
} satisfies Prisma.ProductSelect;

const detailSelect = {
  id: true,
  name: true,
  slug: true,
  sku: true,
  brand: true,
  description: true,
  price: true,
  discountPrice: true,
  stockQuantity: true,
  lowStockThreshold: true,
  specifications: true,
  status: true,
  isFeatured: true,
  categoryId: true,
  createdAt: true,
  updatedAt: true,
  category: { select: { id: true, name: true, slug: true } },
  images: {
    orderBy: [{ isCover: "desc" }, { displayOrder: "asc" }],
    select: { id: true, url: true, isCover: true, displayOrder: true },
  },
} satisfies Prisma.ProductSelect;

/** Guarantees exactly one cover image; defaults the first image as cover. */
function normalizeImages(images: ImageInput[]): Prisma.ProductImageCreateManyProductInput[] {
  const coverIndex = images.findIndex((img) => img.isCover);
  const cover = coverIndex === -1 ? 0 : coverIndex;
  return images.map((img, i) => ({
    url: img.url,
    isCover: i === cover,
    displayOrder: img.displayOrder ?? i,
  }));
}

async function uniqueSlug(base: string): Promise<string> {
  const root = base || "product";
  let candidate = root;
  let n = 1;
  for (;;) {
    const existing = await prisma.product.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!existing) return candidate;
    n += 1;
    candidate = `${root}-${n}`;
  }
}

function buildOrderBy(
  sort: ProductListQuery["sort"],
): Prisma.ProductOrderByWithRelationInput {
  switch (sort) {
    case "oldest":
      return { createdAt: "asc" };
    case "price_asc":
      return { price: "asc" };
    case "price_desc":
      return { price: "desc" };
    case "name_asc":
      return { name: "asc" };
    case "name_desc":
      return { name: "desc" };
    case "newest":
    default:
      return { createdAt: "desc" };
  }
}

async function buildWhere(
  query: ProductListQuery,
  opts: { forcePublic: boolean },
): Promise<Prisma.ProductWhereInput> {
  const where: Prisma.ProductWhereInput = {};

  if (opts.forcePublic) {
    where.status = "ACTIVE";
    where.category = { isActive: true };
  } else if (query.status) {
    where.status = query.status;
  }

  if (query.categoryId) where.categoryId = query.categoryId;
  if (query.categorySlug) {
    const cat = await prisma.category.findUnique({
      where: { slug: query.categorySlug },
      select: { id: true },
    });
    // Unknown slug -> match nothing rather than everything.
    where.categoryId = cat?.id ?? "__no_match__";
  }
  if (query.brand) where.brand = { equals: query.brand, mode: "insensitive" };
  if (query.isFeatured !== undefined) where.isFeatured = query.isFeatured;
  if (query.inStock) where.stockQuantity = { gt: 0 };

  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    where.price = {};
    if (query.minPrice !== undefined) where.price.gte = query.minPrice;
    if (query.maxPrice !== undefined) where.price.lte = query.maxPrice;
  }

  if (query.q) {
    where.OR = [
      { name: { contains: query.q, mode: "insensitive" } },
      { description: { contains: query.q, mode: "insensitive" } },
      { brand: { contains: query.q, mode: "insensitive" } },
      { sku: { contains: query.q, mode: "insensitive" } },
    ];
  }

  return where;
}

export async function listProducts(
  query: ProductListQuery,
  opts: { forcePublic: boolean },
) {
  const { page, pageSize } = query;
  const where = await buildWhere(query, opts);

  const [items, total] = await prisma.$transaction([
    prisma.product.findMany({
      where,
      select: listSelect,
      orderBy: buildOrderBy(query.sort),
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.product.count({ where }),
  ]);

  return { items, meta: buildListMeta(total, page, pageSize) };
}

export async function getProductBySlug(slug: string, opts: { forcePublic: boolean }) {
  const product = await prisma.product.findUnique({
    where: { slug },
    select: detailSelect,
  });
  if (!product || (opts.forcePublic && product.status !== "ACTIVE")) {
    throw HttpError.notFound("Product not found");
  }

  const related = await prisma.product.findMany({
    where: {
      categoryId: product.categoryId,
      id: { not: product.id },
      ...(opts.forcePublic ? { status: "ACTIVE" } : {}),
    },
    select: listSelect,
    take: 8,
    orderBy: { createdAt: "desc" },
  });

  return { ...product, related };
}

export async function getProductById(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    select: detailSelect,
  });
  if (!product) throw HttpError.notFound("Product not found");
  return product;
}

export async function createProduct(input: ProductCreateInput) {
  const slug = await uniqueSlug(slugify(input.name));

  const data: Prisma.ProductUncheckedCreateInput = {
    name: input.name,
    slug,
    sku: input.sku,
    categoryId: input.categoryId,
    price: input.price,
  };
  if (input.brand !== undefined) data.brand = input.brand;
  if (input.description !== undefined) data.description = input.description;
  if (input.discountPrice !== undefined) data.discountPrice = input.discountPrice;
  if (input.stockQuantity !== undefined) data.stockQuantity = input.stockQuantity;
  if (input.lowStockThreshold !== undefined)
    data.lowStockThreshold = input.lowStockThreshold;
  if (input.status !== undefined) data.status = input.status;
  if (input.isFeatured !== undefined) data.isFeatured = input.isFeatured;
  if (input.specifications !== undefined)
    data.specifications =
      input.specifications === null ? Prisma.DbNull : input.specifications;
  if (input.images && input.images.length > 0)
    data.images = { createMany: { data: normalizeImages(input.images) } };

  return prisma.product.create({ data, select: detailSelect });
}

export async function updateProduct(id: string, input: ProductUpdateInput) {
  const data: Prisma.ProductUncheckedUpdateInput = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.sku !== undefined) data.sku = input.sku;
  if (input.categoryId !== undefined) data.categoryId = input.categoryId;
  if (input.brand !== undefined) data.brand = input.brand;
  if (input.description !== undefined) data.description = input.description;
  if (input.price !== undefined) data.price = input.price;
  if (input.discountPrice !== undefined) data.discountPrice = input.discountPrice;
  if (input.stockQuantity !== undefined) data.stockQuantity = input.stockQuantity;
  if (input.lowStockThreshold !== undefined)
    data.lowStockThreshold = input.lowStockThreshold;
  if (input.status !== undefined) data.status = input.status;
  if (input.isFeatured !== undefined) data.isFeatured = input.isFeatured;
  if (input.specifications !== undefined)
    data.specifications =
      input.specifications === null ? Prisma.DbNull : input.specifications;
  // Replace the full image set when `images` is supplied.
  if (input.images !== undefined)
    data.images = {
      deleteMany: {},
      createMany: { data: normalizeImages(input.images) },
    };

  return prisma.product.update({ where: { id }, data, select: detailSelect });
}

export async function deleteProduct(id: string) {
  // OrderItem keeps a snapshot (productId set null on delete), so deleting a
  // product never destroys order history.
  const existing = await prisma.product.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!existing) throw HttpError.notFound("Product not found");

  await prisma.product.delete({ where: { id } });
  return { id };
}
