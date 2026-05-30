"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "O que é o Hyperion Pay?",
    answer:
      "Hyperion Pay é uma plataforma de gateway de pagamentos PIX que permite receber e enviar pagamentos de forma rápida, segura e anônima. Oferecemos infraestrutura completa para operações financeiras sem as burocracias tradicionais.",
  },
  {
    question: "Preciso fazer verificação de identidade (KYC)?",
    answer:
      "Não. O Hyperion Pay opera sem necessidade de KYC complexo. Você pode criar sua conta e começar a operar rapidamente, mantendo sua privacidade.",
  },
  {
    question: "O que significa 'sem MED'?",
    answer:
      "MED (Mecanismo Especial de Devolução) é um sistema do Banco Central para contestação de transações PIX. No Hyperion Pay, suas transações são processadas de forma que minimiza riscos de contestações indevidas.",
  },
  {
    question: "Como funciona a API?",
    answer:
      "Nossa API REST é simples e bem documentada. Você recebe uma chave API única ao criar sua conta e pode integrar em minutos. Oferecemos endpoints para criar cobranças, consultar transações, gerenciar chaves PIX e configurar webhooks.",
  },
  {
    question: "Quais são as taxas?",
    answer:
      "Nossas taxas começam em 1.5% por transação no plano Starter. Para volumes maiores, oferecemos taxas reduzidas nos planos Pro (1.0%) e Enterprise (negociável). Não há taxas mensais ou escondidas.",
  },
  {
    question: "Como recebo notificações das transações?",
    answer:
      "Você pode configurar webhooks para receber notificações em tempo real sobre todas as transações. Cada evento (pagamento recebido, transferência enviada, etc.) dispara uma chamada HTTP para sua URL configurada.",
  },
  {
    question: "Qual o tempo de processamento das transações?",
    answer:
      "As transações PIX são processadas instantaneamente, geralmente em menos de 1 segundo. Nossa infraestrutura opera 24/7 com uptime de 99.9%.",
  },
  {
    question: "Posso usar para meu e-commerce?",
    answer:
      "Sim! Nossa API é perfeita para integração com e-commerces, marketplaces e qualquer sistema que precise processar pagamentos PIX. Oferecemos SDKs e exemplos de código para facilitar a integração.",
  },
];

export function FAQ() {
  return (
    <section id="faq" className="py-24 relative">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-6 text-balance">
            Perguntas{" "}
            <span className="text-primary">frequentes</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Tire suas dúvidas sobre a plataforma e como começar a operar.
          </p>
        </motion.div>

        {/* FAQ Accordion */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="max-w-3xl mx-auto"
        >
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-card border border-border rounded-xl px-6 data-[state=open]:border-primary/50"
              >
                <AccordionTrigger className="text-left text-foreground hover:text-primary hover:no-underline py-4">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-4">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}
