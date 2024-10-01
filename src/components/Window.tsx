export function Window({
  title,
  children,
  className,
}: {
  title: string;
  children: string;
  className: string;
}) {
  return (
    <div
      className={`w-fit min-w-[200px] border-x-[3px] border-accent border-b-[3px] drop-shadow-lg ${className}`}
    >
      <div className="flex flex-row justify-between bg-accent w-full items-center px-1 py-2">
        <p className="w-2/3 truncate font-mono outline-2 outline-primary text-primary m-0 uppercase text-xl font-bold px-1">
          {title}
        </p>

        <svg
          width="10"
          height="8"
          viewBox="0 0 10 8"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M1 0.4H0.9V0.5V1.5V1.6H1H1.9V2.5V2.6H2H2.9V3.5V3.6H3H3.9V4.4H3H2.9V4.5V5.4H2H1.9V5.5V6.4H1H0.9V6.5V7.5V7.6H1H3H3.1V7.5V6.6H4H4.1V6.5V5.6H5.9V6.5V6.6H6H6.9V7.5V7.6H7H9H9.1V7.5V6.5V6.4H9H8.1V5.5V5.4H8H7.1V4.5V4.4H7H6.1V3.6H7H7.1V3.5V2.6H8H8.1V2.5V1.6H9H9.1V1.5V0.5V0.4H9H7H6.9V0.5V1.4H6H5.9V1.5V2.4H4.1V1.5V1.4H4H3.1V0.5V0.4H3H1Z"
            fill="white"
            stroke="white"
            stroke-width="0.2"
          />
        </svg>
      </div>
      <div className="bg-white">{children}</div>
    </div>
  );
}
