import type { ImageMetadata } from "astro";

const modules = import.meta.glob<{ default: ImageMetadata }>(
  "../assets/prints/*.{jpg,jpeg,png,webp}",
  { eager: true },
);

const byFile: Record<string, ImageMetadata> = {};
for (const [path, mod] of Object.entries(modules)) {
  const file = path.split("/").pop();
  if (file) byFile[file] = mod.default;
}

export function printImage(file: string): ImageMetadata {
  const img = byFile[file];
  if (!img) throw new Error(`Missing print image: ${file}`);
  return img;
}

export function printFiles() {
  return byFile;
}
