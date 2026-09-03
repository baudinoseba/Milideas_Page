export function BanderaArgentina({ className = "w-4 h-2.5 inline-block align-middle" }: { className?: string }) {
  return (
    <svg
      className={`rounded-[2px] shadow-2xs shrink-0 ${className}`}
      viewBox="0 0 768 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Bandera Argentina"
      role="img"
    >
      <rect width="768" height="170.67" fill="#75AADB" />
      <rect y="170.67" width="768" height="170.67" fill="#FFFFFF" />
      <rect y="341.33" width="768" height="170.67" fill="#75AADB" />
      <circle cx="384" cy="256" r="34" fill="#F6B40E" />
      <circle cx="384" cy="256" r="22" fill="#85340A" />
      <circle cx="384" cy="256" r="18" fill="#F6B40E" />
    </svg>
  );
}
