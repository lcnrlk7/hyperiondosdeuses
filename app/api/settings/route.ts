import { NextResponse } from "next/server";
import { sql, isDatabaseConfigured } from "@/lib/db";

const DEFAULT_SETTINGS = {
  min_deposit: "1.00",
  max_deposit: "100000.00",
  min_withdrawal: "5.00",
  max_withdrawal: "50000.00",
  daily_withdrawal_limit: "100000.00",
  auto_withdrawal_limit: "500.00",
  pix_fee_percentage: "2.5",
  withdrawal_fee_percentage: "1.5",
  withdrawal_fee_fixed: "0.00",
  acquirer_withdrawal_fee: "1.00",
};

export async function GET() {
  try {
    if (!isDatabaseConfigured()) {
      return NextResponse.json({
        settings: {
          minDeposit: 1,
          maxDeposit: 100000,
          minWithdrawal: 5,
          maxWithdrawal: 50000,
          dailyWithdrawalLimit: 100000,
          autoWithdrawalLimit: 500,
          pixFeePercentage: 2.5,
          withdrawalFeePercentage: 1.5,
          withdrawalFeeFixed: 0,
          acquirerFee: 1.00,
        },
      });
    }

    const settings = await sql`
      SELECT key, value FROM system_settings
    `;

    const settingsMap: Record<string, string> = { ...DEFAULT_SETTINGS };
    
    settings.forEach((item: { key: string; value: string }) => {
      settingsMap[item.key] = item.value;
    });

    return NextResponse.json({
      settings: {
        minDeposit: parseFloat(settingsMap.min_deposit) || 1,
        maxDeposit: parseFloat(settingsMap.max_deposit) || 100000,
        minWithdrawal: parseFloat(settingsMap.min_withdrawal) || 5,
        maxWithdrawal: parseFloat(settingsMap.max_withdrawal) || 50000,
        dailyWithdrawalLimit: parseFloat(settingsMap.daily_withdrawal_limit) || 100000,
        autoWithdrawalLimit: parseFloat(settingsMap.auto_withdrawal_limit) || 500,
        pixFeePercentage: parseFloat(settingsMap.pix_fee_percentage) || 2.5,
        withdrawalFeePercentage: parseFloat(settingsMap.withdrawal_fee_percentage) || 1.5,
        withdrawalFeeFixed: parseFloat(settingsMap.withdrawal_fee_fixed) || 0,
        acquirerFee: parseFloat(settingsMap.acquirer_withdrawal_fee) || 1.00,
      },
    });
  } catch (error) {
    console.error("[v0] Error in settings API:", error);
    return NextResponse.json({
      settings: {
        minDeposit: 1,
        maxDeposit: 100000,
        minWithdrawal: 5,
        maxWithdrawal: 50000,
        dailyWithdrawalLimit: 100000,
        autoWithdrawalLimit: 500,
        pixFeePercentage: 2.5,
        withdrawalFeePercentage: 1.5,
        withdrawalFeeFixed: 0,
        acquirerFee: 1.00,
      },
    });
  }
}
