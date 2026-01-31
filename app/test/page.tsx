export default function TestPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Test Page</h1>
        <p className="text-muted-foreground">If you see this, Next.js is working!</p>
        <div className="mt-8 p-4 bg-muted rounded">
          <p className="text-sm">Environment check:</p>
          <p className="text-xs mt-2">
            Convex URL: {process.env.NEXT_PUBLIC_CONVEX_URL ? '✓ Set' : '✗ Missing'}
          </p>
          <p className="text-xs">
            Clerk Key: {process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? '✓ Set' : '✗ Missing'}
          </p>
        </div>
      </div>
    </div>
  );
}
