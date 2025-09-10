'use client';

import { useQuery } from '@tanstack/react-query';

export default function HealthPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['health'],
    queryFn: async () => {
      const response = await fetch('/api/health');
      return response.json();
    },
  });

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Health</h1>
      {isLoading && <p>Loading...</p>}
      {error && <p className="text-red-600">Error loading health data</p>}
      {data && (
        <pre className="rounded-xl bg-gray-50 p-4 text-sm">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </main>
  );
}