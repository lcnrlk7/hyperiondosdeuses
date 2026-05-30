'use client';

import { DollarSign, Code } from 'lucide-react';

export function PricingNew() {
  return (
    <section className="relative py-20 px-4 overflow-hidden">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white">
            Taxas transparentes que cabem no seu bolso
          </h2>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* PIX Instantaneo Card */}
          <div className="relative">
            {/* Badge Melhor Condicao */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
              <span className="px-4 py-1 bg-indigo-500 text-black text-xs font-bold rounded-full uppercase tracking-wide">
                Melhor Condição
              </span>
            </div>
            
            <div className="relative bg-gradient-to-br from-indigo-500/20 to-indigo-600/10 border border-indigo-500/30 rounded-2xl p-6 pt-8 h-full">
              {/* Icon */}
              <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center mb-4">
                <DollarSign className="w-6 h-6 text-black" />
              </div>
              
              {/* Title */}
              <h3 className="text-xl font-semibold text-white mb-4">PIX Instantâneo</h3>
              
              {/* Price */}
              <div className="mb-4">
                <span className="text-4xl font-bold text-indigo-500">R$0,50</span>
                <span className="text-lg text-gray-400 ml-2">fixo</span>
              </div>
              
              {/* Description */}
              <div className="space-y-1 text-gray-400 text-sm">
                <p>Taxa fixa por transação.</p>
                <p>Receba na hora.</p>
              </div>
            </div>
          </div>

          {/* API PIX Card */}
          <div className="relative bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 h-full">
            {/* Icon */}
            <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center mb-4">
              <Code className="w-6 h-6 text-black" />
            </div>
            
            {/* Title */}
            <h3 className="text-xl font-semibold text-white mb-4">API PIX</h3>
            
            {/* Price */}
            <div className="mb-4">
              <span className="text-4xl font-bold text-indigo-500">R$0,50</span>
              <span className="text-lg text-gray-400 ml-2">fixo</span>
            </div>
            
            {/* Description */}
            <div className="space-y-1 text-gray-400 text-sm">
              <p>Integração via API.</p>
              <p>Documentação completa.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
