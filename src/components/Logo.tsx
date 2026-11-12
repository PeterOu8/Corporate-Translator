/** Two speech bubbles and opposing arrows represent the two translation directions. */
export default function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M20 6h17a7 7 0 0 1 7 7v13a7 7 0 0 1-7 7h-2l-7 6v-6h-8a7 7 0 0 1-7-7V13a7 7 0 0 1 7-7Z"
        className="fill-preview stroke-primary/30"
        strokeWidth="1.5"
      />
      <path
        d="M10 14h17a7 7 0 0 1 7 7v12a7 7 0 0 1-7 7H15l-8 6v-6a7 7 0 0 1-4-6V21a7 7 0 0 1 7-7Z"
        className="fill-primary"
      />
      <path
        d="M11 24h15m-4-4 4 4-4 4M26 32H11m4-4-4 4 4 4"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
