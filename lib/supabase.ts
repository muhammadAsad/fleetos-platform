"use client";
import { createBrowserClient } from "@supabase/ssr";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

const isPlaceholder = !SUPABASE_URL || SUPABASE_URL.includes("your-project");

export function createClient(): any {
  if (isPlaceholder) {
    return createMockClient();
  }
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

function createMockClient() {
  // Resolved value for awaited queries
  const emptyResult = { data: [], error: null };
  const nullResult = { data: null, error: null };

  // Make a chainable object that:
  // - returns itself for any method call (so chains work)
  // - resolves to empty data when awaited (then/catch/finally)
  // - subscribe() is a no-op function that returns { unsubscribe: () => {} }
  function makeChain(overrides: Record<string, any> = {}): any {
    const chain: any = new Proxy(function () {}, {
      // Called as a function: returns self (for chaining like .eq("x","y"))
      apply(_target, _thisArg, _args) {
        return chain;
      },
      get(_target, prop: string) {
        if (prop === "then") {
          // Behave like a resolved promise with empty data
          return (resolve: (v: any) => any) => Promise.resolve(emptyResult).then(resolve);
        }
        if (prop === "catch") return (_fn: any) => chain;
        if (prop === "finally") return (fn: any) => { fn(); return chain; };

        // Realtime channel chaining
        if (prop === "subscribe") return (cb?: (status: string) => void) => {
          cb?.("SUBSCRIBED");
          return { unsubscribe: () => {} };
        };
        if (prop === "removeChannel") return () => {};
        if (prop === "unsubscribe") return () => {};

        // single() resolves with null data
        if (prop === "single") return () => ({
          ...nullResult,
          then: (resolve: (v: any) => any) => Promise.resolve(nullResult).then(resolve),
        });

        // auth helpers
        if (prop === "auth") return {
          signInWithPassword: () => Promise.resolve(nullResult),
          signUp: () => Promise.resolve(nullResult),
          signOut: () => Promise.resolve(nullResult),
          getUser: () => Promise.resolve({ data: { user: null }, error: null }),
          onAuthStateChange: (_cb: any) => ({ data: { subscription: { unsubscribe: () => {} } } }),
          signInWithOAuth: () => Promise.resolve(nullResult),
        };

        if (prop in overrides) return overrides[prop];

        // Everything else: return a function that returns another chain
        return makeChain();
      },
    });
    return chain;
  }

  return makeChain();
}
