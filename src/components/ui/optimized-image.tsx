import Image, { ImageProps } from "next/image";
import { cn } from "@/lib/utils/cn";

type OptimizedImageProps = Omit<ImageProps, "alt"> & {
  alt: string;
  aspectRatio?: "square" | "portrait" | "none";
  objectFit?: "cover" | "contain";
};

export function OptimizedImage({
  className,
  aspectRatio = "square",
  objectFit = "cover",
  sizes = "(max-width: 768px) 100vw, 50vw",
  alt,
  priority,
  ...props
}: OptimizedImageProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl bg-surface/50",
        aspectRatio === "square" && "aspect-square",
        aspectRatio === "portrait" && "aspect-[3/4]",
        className,
      )}
    >
      <Image
        fill
        sizes={sizes}
        className={cn(
          objectFit === "contain" ? "object-contain p-2" : "object-cover",
        )}
        loading={priority ? undefined : "lazy"}
        priority={priority}
        alt={alt}
        {...props}
      />
    </div>
  );
}
