export function SectionWrapper({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return (
    <section className={`py-4 md:py-6 ${className}`}>
      <div className="mx-auto w-full max-w-[1280px] px-4 md:px-6 lg:px-8">
        {children}
      </div>
    </section>
  );
}

export function PageHeader({
  title,
  description,
  action
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-start gap-1 md:flex-row md:items-center md:justify-between pb-3">
      <div>
        <h2 className="font-[Oswald] text-lg font-bold uppercase tracking-wide text-[#FFFFFF] md:text-xl">
          {title}
        </h2>
        {description && (
          <p className="mt-0.5 text-xs text-[#9A9A9A]">{description}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
