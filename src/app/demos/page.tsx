import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function DemosPage() {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return redirect('/login');
  }

  const { data: demos, error } = await supabase
    .from('demos')
    .select('id, name, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching demos:', error);
    // You might want to show a proper error page here
    return <div>Error loading demos. Please try again.</div>;
  }

  if (demos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <h2 className="text-2xl font-semibold mb-4">No Demos Found</h2>
        <p className="text-gray-500 mb-6">You haven't created any demos yet. Let's get started!</p>
        <Link href="/demos/create" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          Create Your First Demo
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Your Demos</h1>
        <Link href="/demos/create" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          + New Demo
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {demos.map((demo) => (
          <Link href={`/demos/${demo.id}/configure`} key={demo.id}>
            <div className="block p-6 bg-white border border-gray-200 rounded-lg shadow hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700">
              <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">{demo.name}</h5>
              <p className="font-normal text-gray-700 dark:text-gray-400">
                Created on: {new Date(demo.created_at).toLocaleDateString()}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
