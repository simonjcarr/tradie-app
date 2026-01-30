# Tradie App Setup Guide

Your app has been configured with Next.js, Clerk authentication, and Convex backend. Follow these final steps to complete the setup.

## Completed Setup

✅ Dependencies installed
✅ Convex project initialized
✅ Environment variables configured
✅ ClerkProvider and ConvexProvider integrated
✅ Middleware for route protection created
✅ Example schema and functions created
✅ JWT issuer domain set in Convex environment

## Required: Configure Clerk JWT Template

**IMPORTANT**: You must create a JWT template in Clerk for authentication to work.

1. Go to the [Clerk JWT Templates page](https://dashboard.clerk.com/last-active?path=jwt-templates)
2. Click **New template**
3. Select **Convex** from the list
4. **CRITICAL**: The template name MUST be `convex` (do not rename it)
5. Save the template

That's it! The issuer URL has already been configured.

## Running the Application

1. **Start Convex development server** (in one terminal):
   ```bash
   npx convex dev
   ```

2. **Start Next.js development server** (in another terminal):
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
tradie-app/
├── app/
│   ├── layout.tsx          # Root layout with Clerk and Convex providers
│   ├── page.tsx            # Home page with sign in/up buttons
│   └── globals.css         # Global styles
├── components/
│   ├── ConvexClientProvider.tsx  # Convex + Clerk integration
│   └── ui/                 # shadcn/ui components
├── convex/
│   ├── auth.config.ts      # Clerk authentication config
│   ├── schema.ts           # Database schema
│   └── tasks.ts            # Example CRUD functions
├── lib/
│   └── utils.ts            # Utility functions
├── middleware.ts           # Route protection
└── .env.local              # Environment variables
```

## Example: Using Convex Functions

The example `tasks` functions demonstrate authenticated CRUD operations:

```typescript
// In your React component
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

function TaskList() {
  const tasks = useQuery(api.tasks.getTasks);
  const createTask = useMutation(api.tasks.createTask);

  return (
    <div>
      {tasks?.map(task => (
        <div key={task._id}>{task.text}</div>
      ))}
      <button onClick={() => createTask({ text: "New task" })}>
        Add Task
      </button>
    </div>
  );
}
```

## Next Steps

1. Complete the Clerk JWT template setup (see above)
2. Customize the database schema in `convex/schema.ts`
3. Add your business logic functions in the `convex/` directory
4. Build your UI components
5. Add protected routes as needed in `middleware.ts`

## Troubleshooting

- **Authentication errors**: Ensure the Clerk JWT template is named `convex`
- **Convex connection issues**: Check that `NEXT_PUBLIC_CONVEX_URL` is in `.env.local`
- **Type errors**: Run `npx convex dev` to regenerate types

## Documentation

- [Convex Docs](https://docs.convex.dev)
- [Clerk Docs](https://clerk.com/docs)
- [Next.js Docs](https://nextjs.org/docs)
