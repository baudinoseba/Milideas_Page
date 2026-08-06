import Image, { ImageProps } from "next/image";
import { cn } from "@/lib/utils/cn";

type OptimizedImageProps = Omit<ImageProps, "alt"> & {
  alt: string;
  aspectRatio?: "square" | "portrait";
};

export function OptimizedImage({
  className,
  aspectRatio = "square",
  sizes = "(max-width: 768px) 100vw, 50vw",
  alt,
  ...props
}: OptimizedImageProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden bg-border/30",
        aspectRatio === "square" ? "aspect-square" : "aspect-[3/4]",
        className,
      )}
    >
      <Image
        fill
        sizes={sizes}
        className="object-cover"
        loading="lazy"
        alt={alt}
        {...props}
      />
    </div>
  );
}
