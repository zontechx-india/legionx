import { prisma } from "../config/prisma.js";
import {
  recomputeProductAggregates,
  uniqueCategorySlug,
  uniqueProductSlug,
} from "../modules/stores/catalogSlug.js";

/**
 * One-off migration helper: fills `slug` on every store category/product that
 * predates the storefront refactor, and recomputes the denormalised
 * price/stock aggregates for every product.
 *
 * Why it exists: `slug` had to be introduced as a NULLABLE column, because a
 * required unique column cannot be added to already-populated tables. Run this
 * once, then tighten the column to `String` in schema.prisma and push again.
 *
 * Safe to re-run — rows that already have a slug are skipped, and aggregates
 * are simply recomputed from the current variants.
 *
 *   npm run backfill-catalog
 */
async function main() {
  let categoriesFilled = 0;
  let productsFilled = 0;
  let aggregatesUpdated = 0;

  // --- Category slugs ------------------------------------------------------
  // The column is typed non-nullable now that it has been tightened, so the
  // "missing" check happens at runtime: rows created while it was nullable can
  // still hold null/"" in the database.
  const allCategories = await prisma.storeCategory.findMany({
    select: { id: true, storeId: true, name: true, slug: true },
    orderBy: { createdAt: "asc" },
  });
  const categories = allCategories.filter((row) => !row.slug);
  for (const category of categories) {
    const slug = await uniqueCategorySlug(
      category.storeId,
      category.name,
      prisma,
      category.id,
    );
    await prisma.storeCategory.update({
      where: { id: category.id },
      data: { slug },
    });
    categoriesFilled += 1;
  }

  // --- Product slugs -------------------------------------------------------
  const allProducts = await prisma.storeProduct.findMany({
    select: { id: true, storeId: true, name: true, slug: true },
    orderBy: { createdAt: "asc" },
  });
  const products = allProducts.filter((row) => !row.slug);
  for (const product of products) {
    const slug = await uniqueProductSlug(
      product.storeId,
      product.name,
      prisma,
      product.id,
    );
    await prisma.storeProduct.update({
      where: { id: product.id },
      data: { slug },
    });
    productsFilled += 1;
  }

  // --- Price / stock aggregates for every product --------------------------
  const all = await prisma.storeProduct.findMany({ select: { id: true } });
  for (const product of all) {
    await recomputeProductAggregates(product.id);
    aggregatesUpdated += 1;
  }

  // --- publishedAt for stores published before the column existed ----------
  // Best available approximation is createdAt; new publishes stamp the real
  // moment (stores.service.setStorePublished). Per-row because the value
  // copies each store's own createdAt.
  const unstamped = await prisma.store.findMany({
    where: { isPublished: true, publishedAt: null },
    select: { id: true, createdAt: true },
  });
  for (const store of unstamped) {
    await prisma.store.update({
      where: { id: store.id },
      data: { publishedAt: store.createdAt },
    });
  }

  console.log(
    `Backfill complete: ${categoriesFilled} category slug(s), ` +
      `${productsFilled} product slug(s), ${aggregatesUpdated} product aggregate(s), ` +
      `${unstamped.length} store publishedAt stamp(s).`,
  );
}

main()
  .catch((error) => {
    console.error("Backfill failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
