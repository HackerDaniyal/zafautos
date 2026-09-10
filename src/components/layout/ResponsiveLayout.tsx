export function SectionWrapper({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return (
    <section className={`py-6 md:py-10 ${className}`}>
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
    <div className="flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:justify-between pb-4">
      <div>
        <h2 className="text-lg font-bold text-gray-900 sm:text-xl">
          {title}
        </h2>
        {description && (
          <p className="mt-0.5 text-sm text-gray-500">{description}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
