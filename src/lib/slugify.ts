import prisma from "./prisma";

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function uniqueSlug(base: string): Promise<string> {
  const slug = slugify(base);
  const existing = await prisma.circle.findUnique({ where: { slug } });
  if (!existing) return slug;

  let counter = 2;
  while (true) {
    const candidate = `${slug}-${counter}`;
    const exists = await prisma.circle.findUnique({ where: { slug: candidate } });
    if (!exists) return candidate;
    counter++;
  }
}
