import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { DashboardContent, Profile, Transaction, PixKey } from "@/components/dashboard/dashboard-content"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
  try {
    const session = await getSession()
    
    if (!session) {
      redirect("/auth/login")
    }

    let profiles: any[] = []
    try {
      profiles = await sql`
        SELECT * FROM profiles WHERE id = ${session.userId}
      `
    } catch (e) {
      console.error("[v0] Error fetching profile:", e)
      redirect("/auth/login")
    }
    
    if (!profiles || profiles.length === 0) {
      redirect("/auth/login")
    }
    
    // Calculate total_revenue from completed transactions (pix_in is the income type)
    let totalRevenue = 0
    try {
      const revenueResult = await sql`
        SELECT COALESCE(SUM(amount), 0) as total_revenue 
        FROM transactions 
        WHERE user_id = ${session.userId} 
        AND type IN ('pix_in', 'received', 'deposit', 'sale')
        AND status = 'completed'
      `
      totalRevenue = parseFloat(revenueResult[0]?.total_revenue || 0)
    } catch (e) {
      console.error("[v0] Error fetching revenue:", e)
    }
    
    const profile = {
      ...profiles[0],
      total_revenue: totalRevenue
    } as Profile

    // Get ALL transactions for stats calculation (not just 10)
    let transactions: any[] = []
    try {
      transactions = await sql`
        SELECT * FROM transactions 
        WHERE user_id = ${session.userId} 
        ORDER BY created_at DESC
      `
    } catch (e) {
      console.error("[v0] Error fetching transactions:", e)
    }

    let pixKeys: any[] = []
    try {
      pixKeys = await sql`
        SELECT * FROM pix_keys WHERE user_id = ${session.userId}
      `
    } catch (e) {
      console.error("[v0] Error fetching pix keys:", e)
    }

    return (
      <DashboardContent
        profile={profile}
        transactions={(transactions || []) as Transaction[]}
        pixKeys={(pixKeys || []) as PixKey[]}
      />
    )
  } catch (error) {
    console.error("[v0] Dashboard page error:", error)
    redirect("/auth/login")
  }
}
