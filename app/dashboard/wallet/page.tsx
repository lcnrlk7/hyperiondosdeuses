"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Wallet, Key, Percent } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WalletContent } from "@/components/dashboard/wallet-content";
import { PixKeysContentClient } from "@/components/dashboard/pix-keys-content-client";
import { FeesContent } from "@/components/dashboard/fees-content";

type TabType = "wallet" | "pix-keys" | "fees";

const tabs = [
  { id: "wallet" as const, label: "Carteira", icon: Wallet },
  { id: "pix-keys" as const, label: "Chaves PIX", icon: Key },
  { id: "fees" as const, label: "Taxas", icon: Percent },
];

export default function WalletPage() {
  const [activeTab, setActiveTab] = useState<TabType>("wallet");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
          Carteira
        </h1>
        <p className="text-muted-foreground mt-1">
          Gerencie seu saldo, chaves PIX e taxas
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border pb-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <Button
              key={tab.id}
              variant={isActive ? "default" : "ghost"}
              onClick={() => setActiveTab(tab.id)}
              className={`gap-2 ${isActive ? "bg-primary text-primary-foreground" : ""}`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </Button>
          );
        })}
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {activeTab === "wallet" && <WalletContent />}
        {activeTab === "pix-keys" && <PixKeysContentClient />}
        {activeTab === "fees" && <FeesContent />}
      </motion.div>
    </div>
  );
}
