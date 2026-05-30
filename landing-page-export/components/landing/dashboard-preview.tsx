'use client';

import React from 'react';
import { Eye, EyeOff, Copy, Settings, Home, Wallet, TrendingUp, Lock, Zap } from 'lucide-react';
import { useState } from 'react';

export function DashboardPreview() {
  const [showApiKey, setShowApiKey] = useState(false);

  return (
    <section className="relative min-h-screen flex items-center justify-center py-20 z-20 px-4">
      <div className="relative w-full max-w-7xl">
        {/* Section title */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Dashboard Intuitivo
          </h2>
          <p className="text-gray-400 text-lg">
            Gerenciar suas transações PIX é simples e seguro
          </p>
        </div>

        {/* Dashboard Container */}
        <div className="bg-black border border-indigo-600/30 rounded-2xl overflow-hidden shadow-2xl shadow-indigo-500/10">
          <div className="grid grid-cols-12 h-screen max-h-[600px]">
            {/* Sidebar */}
            <div className="col-span-2 bg-black border-r border-indigo-600/20 p-4 flex flex-col">
              <div className="flex items-center gap-2 mb-8 pb-6 border-b border-indigo-600/20">
                <Zap className="w-6 h-6 text-indigo-500" />
                <span className="font-bold text-white">Hyperion Pay</span>
              </div>

              <nav className="space-y-3 flex-1">
                <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-indigo-500/20 border border-indigo-500/40">
                  <Home className="w-5 h-5 text-indigo-400" />
                  <span className="text-sm text-indigo-300 font-medium">Dashboard</span>
                </div>
                <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-900/50 transition-colors">
                  <Wallet className="w-5 h-5 text-gray-600" />
                  <span className="text-sm text-gray-500">Carteira</span>
                </div>
                <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-900/50 transition-colors">
                  <TrendingUp className="w-5 h-5 text-gray-600" />
                  <span className="text-sm text-gray-500">Transações</span>
                </div>
                <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-900/50 transition-colors">
                  <Lock className="w-5 h-5 text-gray-600" />
                  <span className="text-sm text-gray-500">Segurança</span>
                </div>
              </nav>

              <button className="flex items-center gap-3 px-3 py-2 rounded-lg w-full hover:bg-gray-900/50 transition-colors border-t border-gray-900 pt-4">
                <Settings className="w-5 h-5 text-gray-600" />
                <span className="text-sm text-gray-500">Configurações</span>
              </button>
            </div>

            {/* Main Content */}
            <div className="col-span-10 p-8 overflow-y-auto bg-gradient-to-b from-black to-gray-950">
              {/* Header */}
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h1 className="text-2xl font-bold text-white">Olá, Usuário!</h1>
                  <p className="text-gray-600 text-sm">Bem-vindo ao seu painel de controle</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-600 text-sm">Saldo Líquido</p>
                  <p className="text-3xl font-bold text-indigo-500">R$ 437.855,00</p>
                </div>
              </div>

              {/* Stats Grid - Beautiful Cards */}
              <div className="grid grid-cols-4 gap-4 mb-8">
                {/* Saldo Card */}
                <div className="group bg-gradient-to-br from-gray-900 to-black border border-indigo-600/40 rounded-xl p-6 hover:border-indigo-500/60 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/10">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-gray-400 text-sm font-medium">Saldo</p>
                    <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center group-hover:bg-indigo-500/30 transition-colors">
                      <Wallet className="w-5 h-5 text-indigo-500" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-white mb-2">R$ 437.855,00</p>
                  <p className="text-green-500 text-xs">Disponível para saque</p>
                </div>

                {/* Bruto Card */}
                <div className="group bg-gradient-to-br from-gray-900 to-black border border-indigo-600/40 rounded-xl p-6 hover:border-indigo-500/60 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/10">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-gray-400 text-sm font-medium">Bruto</p>
                    <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                      <TrendingUp className="w-5 h-5 text-blue-500" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-white mb-2">R$ 20,00</p>
                  <p className="text-blue-500 text-xs">Este mês</p>
                </div>

                {/* Líquido Card */}
                <div className="group bg-gradient-to-br from-gray-900 to-black border border-indigo-600/40 rounded-xl p-6 hover:border-indigo-500/60 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/10">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-gray-400 text-sm font-medium">Líquido</p>
                    <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center group-hover:bg-green-500/30 transition-colors">
                      <Zap className="w-5 h-5 text-green-500" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-white mb-2">R$ 18,50</p>
                  <p className="text-green-500 text-xs">Este mês</p>
                </div>

                {/* Chaves PIX Card */}
                <div className="group bg-gradient-to-br from-gray-900 to-black border border-indigo-600/40 rounded-xl p-6 hover:border-indigo-500/60 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/10">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-gray-400 text-sm font-medium">Chaves PIX</p>
                    <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center group-hover:bg-indigo-500/30 transition-colors">
                      <Lock className="w-5 h-5 text-indigo-500" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-white mb-2">3</p>
                  <p className="text-indigo-500 text-xs">Cadastradas</p>
                </div>
              </div>

              {/* API Key Section */}
              <div className="bg-gradient-to-br from-gray-900 to-black border border-indigo-600/30 rounded-xl p-6 hover:border-indigo-500/50 transition-all duration-300">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-white font-semibold mb-1">Sua Chave API</h3>
                    <p className="text-gray-500 text-sm">Use para integrar com sua aplicação</p>
                  </div>
                  <Copy className="w-5 h-5 text-gray-500 cursor-pointer hover:text-indigo-400 transition-colors" />
                </div>
                <div className="flex items-center gap-2 bg-black/50 border border-gray-800 rounded-lg px-4 py-3 hover:border-indigo-600/20 transition-colors">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value="ip_7a7bc021cd38483b896b15209f537865"
                    readOnly
                    className="bg-transparent text-gray-500 text-sm flex-1 outline-none font-mono"
                  />
                  <button
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="text-gray-500 hover:text-indigo-400 transition-colors"
                  >
                    {showApiKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-4 mt-8">
                <button className="bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40">
                  <Zap className="w-5 h-5" />
                  Depositar
                </button>
                <button className="bg-black border border-indigo-600/40 hover:border-indigo-500/60 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 hover:bg-indigo-500/10">
                  <TrendingUp className="w-5 h-5" />
                  Sacar
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Note below dashboard */}
        <div className="mt-8 text-center text-gray-400 text-sm">
          <p>
            Os dados acima são <span className="text-indigo-400">demonstrativos</span> • APIs bloqueadas para segurança
          </p>
        </div>
      </div>
    </section>
  );
}
