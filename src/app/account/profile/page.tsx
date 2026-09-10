import { getMyProfile } from '@/server/actions/accountActions';
import { ProfileClient } from './client';

export const metadata = { title: 'My Profile | ZafAutos Japan' };

export default async function ProfilePage() {
  const profile = await getMyProfile();

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-pure-white">My Profile</h1>
        <p className="text-sm text-steel mt-1">Manage your account information</p>
      </div>
      <ProfileClient profile={profile} />
    </div>
  );
}
