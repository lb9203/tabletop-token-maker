import type { JSX } from "preact";
export { Icon };
const paths = {
  upload: "M12 16V3m-5 5 5-5 5 5M4 15v6h16v-6",
  download: "M12 3v13m-5-5 5 5 5-5M4 17v4h16v-4",
  plus: "M12 5v14M5 12h14",
  close: "m6 6 12 12M6 18 18 6",
  image: "M3 3h18v18H3zM3 16l6-6 5 5 3-3 4 4M16 7h.01",
  circle: "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0",
  square: "M4 4h16v16H4z",
};

type IconProps = JSX.SVGAttributes<SVGSVGElement> & {
  name: keyof typeof paths;
};

function Icon({ name, ...props }: IconProps) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.7"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d={paths[name]} />
    </svg>
  );
}
