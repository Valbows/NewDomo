export default function HomePage() {
  console.log('🏠 Simple HomePage rendering');
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>Domo AI - Test Page</h1>
      <p>If you see this, the deployment is working!</p>
      <p>Environment check:</p>
      <ul>
        <li>NODE_ENV: {process.env.NODE_ENV}</li>
        <li>Has Supabase URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Yes' : 'No'}</li>
      </ul>
    </div>
  );
}
