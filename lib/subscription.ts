"use client";
import { useEffect, useState } from "react";
import { createClient } from "./supabase";

export type Plan = "free" | "basic" | "pro";
export type SubStatus = "active" | "suspended";

export interface Subscription {
  id?: string;
  company_id?: string;
  plan: Plan;
  status: SubStatus;
  vehicle_limit: number;
  driver_limit: number;
  expires_at?: string | null;
}

// Canonical limits per plan — also used by admin UI
export const PLAN_META: Record<Plan, { label: string; price: number; vehicle_limit: number; driver_limit: number; color: string; bg: string }> = {
  free:  { label: "Free",  price: 0,  vehicle_limit: 2,  driver_limit: 2,  color: "#64748b", bg: "rgba(100,116,139,0.12)" },
  basic: { label: "Basic", price: 49, vehicle_limit: 10, driver_limit: 10, color: "#2563eb", bg: "rgba(37,99,235,0.12)"   },
  pro:   { label: "Pro",   price: 99, vehicle_limit: 25, driver_limit: 25, color: "#7c3aed", bg: "rgba(124,58,237,0.12)"  },
};

// Default used in demo / mock mode — generous limits so demo works out of the box
const DEMO_SUBSCRIPTION: Subscription = {
  plan: "pro",
  status: "active",
  vehicle_limit: 25,
  driver_limit: 25,
};

// ─── Server-side fetch (used in RSC / API routes) ────────────────────────────
export async function fetchSubscription(): Promise<Subscription> {
  const supabase = createClient();
  try {
    const { data: company } = await supabase.from("companies").select("id").single();
    if (!(company as any)?.id) return DEMO_SUBSCRIPTION;

    const { data } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("company_id", (company as any).id)
      .eq("status", "active")
      .single();

    return (data as Subscription | null) ?? DEMO_SUBSCRIPTION;
  } catch {
    return DEMO_SUBSCRIPTION;
  }
}

// ─── React hook for client components ────────────────────────────────────────
export function useSubscription() {
  const [subscription, setSubscription] = useState<Subscription>(DEMO_SUBSCRIPTION);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscription().then((s) => {
      setSubscription(s);
      setLoading(false);
    });
  }, []);

  return { subscription, loading };
}

// ─── Limit helpers ────────────────────────────────────────────────────────────
export interface LimitCheck {
  allowed: boolean;
  current: number;
  limit: number;
  plan: Plan;
}

export async function checkDriverLimit(subscription: Subscription): Promise<LimitCheck> {
  const supabase = createClient();
  const { data } = await supabase.from("drivers").select("id").eq("status", "active");
  const current = (data as any[] | null)?.length ?? 0;
  return { allowed: current < subscription.driver_limit, current, limit: subscription.driver_limit, plan: subscription.plan };
}

export async function checkVehicleLimit(subscription: Subscription): Promise<LimitCheck> {
  const supabase = createClient();
  const { data } = await supabase.from("vehicles").select("id").eq("status", "active");
  const current = (data as any[] | null)?.length ?? 0;
  return { allowed: current < subscription.vehicle_limit, current, limit: subscription.vehicle_limit, plan: subscription.plan };
}
