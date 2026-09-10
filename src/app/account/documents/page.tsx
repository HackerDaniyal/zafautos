import { getMyDocuments } from '@/server/actions/accountActions';
import { DocumentsClient } from './client';

export const metadata = { title: 'My Documents | ZafAutos Japan' };

export default async function DocumentsPage() {
  const data = await getMyDocuments();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-pure-white">My Documents</h1>
        <p className="text-sm text-steel mt-1">Order and shipping documents</p>
      </div>
      <DocumentsClient data={data} />
    </div>
  );
}
