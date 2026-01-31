import { QueryCtx, MutationCtx } from "./_generated/server";

/**
 * Get the authenticated user's ID from the context
 * Returns null if not authenticated
 */
export async function getAuthUserId(ctx: QueryCtx | MutationCtx): Promise<string | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    return null;
  }
  return identity.subject;
}
