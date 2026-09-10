'use client';

function DocLink({ url, label, sublabel }: { url: string; label: string; sublabel?: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 rounded-[8px] border border-iron/10 bg-deep-carbon p-4 hover:border-iron/25 transition-colors"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-signal-red/10">
        <svg className="h-5 w-5 text-signal-red" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-pure-white truncate">{label}</p>
        {sublabel && <p className="text-xs text-steel mt-0.5">{sublabel}</p>}
      </div>
      <svg className="h-4 w-4 text-steel shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
      </svg>
    </a>
  );
}

export function DocumentsClient({ data }: { data: any }) {
  const hasOrderDocs = data.orderDocuments?.length > 0;
  const hasShippingDocs = data.shippingDocuments?.length > 0;

  if (!hasOrderDocs && !hasShippingDocs) {
    return (
      <div className="rounded-[10px] border border-iron/10 bg-deep-carbon p-12 text-center">
        <svg className="mx-auto h-12 w-12 text-steel" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="mt-4 text-sm text-steel">No documents available yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {hasOrderDocs && (
        <div>
          <h2 className="text-sm font-semibold text-pure-white mb-3">Order Documents</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {data.orderDocuments.map((d: any) => (
              <DocLink key={d.id} url={d.documentUrl} label="Order Document" sublabel={new Date(d.createdAt).toLocaleDateString()} />
            ))}
          </div>
        </div>
      )}

      {hasShippingDocs && (
        <div>
          <h2 className="text-sm font-semibold text-pure-white mb-3">Shipping Documents</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {data.shippingDocuments.map((d: any) => (
              <DocLink
                key={d.id}
                url={d.documentUrl}
                label={d.documentName || d.documentType || 'Shipping Document'}
                sublabel={d.documentType ? `${d.documentType} — ${new Date(d.createdAt).toLocaleDateString()}` : new Date(d.createdAt).toLocaleDateString()}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
