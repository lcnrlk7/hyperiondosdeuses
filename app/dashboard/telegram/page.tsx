"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Send, 
  Bot, 
  Wallet, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  History, 
  HelpCircle,
  ExternalLink,
  Copy,
  CheckCircle,
  Smartphone,
  Zap,
  Shield,
  Clock
} from "lucide-react"
import { motion } from "framer-motion"

export default function TelegramPage() {
  const [copied, setCopied] = useState(false)
  const botUsername = "@HyperionPay_bot"
  const botLink = "https://t.me/HyperionPay_bot"

  const handleCopy = () => {
    navigator.clipboard.writeText(botUsername)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const commands = [
    { command: "/start", description: "Abrir menu principal do bot", icon: Bot },
    { command: "/saldo", description: "Ver seu saldo atual", icon: Wallet },
    { command: "/depositar", description: "Gerar PIX para depósito", icon: ArrowDownCircle },
    { command: "/sacar", description: "Solicitar saque via PIX", icon: ArrowUpCircle },
    { command: "/historico", description: "Ver últimas 10 transações", icon: History },
    { command: "/taxas", description: "Consultar taxas aplicadas", icon: HelpCircle },
    { command: "/ajuda", description: "Suporte e ajuda", icon: HelpCircle },
  ]

  const features = [
    {
      icon: Zap,
      title: "Depósitos Instantâneos",
      description: "Gere QR Code PIX e tenha seu saldo creditado automaticamente"
    },
    {
      icon: Shield,
      title: "Seguro e Confiável",
      description: "Suas transações são protegidas e vinculadas à sua conta"
    },
    {
      icon: Clock,
      title: "Disponível 24/7",
      description: "Use o bot a qualquer hora, todos os dias da semana"
    },
    {
      icon: Smartphone,
      title: "Fácil de Usar",
      description: "Interface simples com botões interativos"
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-foreground">Bot Telegram</h1>
        <p className="text-muted-foreground">
          Use nosso bot no Telegram para depositar, sacar e gerenciar seu saldo de forma rápida e prática.
        </p>
      </div>

      {/* Card Principal - Acesso ao Bot */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="bg-gradient-to-br from-[#0088cc]/10 to-[#0088cc]/5 border-[#0088cc]/20">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-[#0088cc] text-white">
                <Send className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-xl">Acesse o Bot</CardTitle>
                <CardDescription>Clique no botão abaixo para iniciar</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-background/50 rounded-lg border">
              <Bot className="h-5 w-5 text-[#0088cc]" />
              <span className="font-mono text-lg font-semibold">{botUsername}</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleCopy}
                className="ml-auto"
              >
                {copied ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            
            <Button 
              asChild 
              className="w-full bg-[#0088cc] hover:bg-[#0088cc]/90 text-white h-12 text-lg"
            >
              <a href={botLink} target="_blank" rel="noopener noreferrer">
                <Send className="mr-2 h-5 w-5" />
                Abrir no Telegram
                <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recursos do Bot */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card className="h-full hover:border-primary/30 transition-colors">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center gap-3">
                  <div className="p-3 rounded-full bg-primary/10">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Comandos Disponiveis */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-primary" />
              Comandos Disponíveis
            </CardTitle>
            <CardDescription>
              Lista de todos os comandos que você pode usar no bot
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {commands.map((cmd) => (
                <div 
                  key={cmd.command}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="p-2 rounded-lg bg-primary/10">
                    <cmd.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <code className="text-sm font-semibold text-primary">{cmd.command}</code>
                    <p className="text-xs text-muted-foreground truncate">{cmd.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Informacoes de Taxas */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              Taxas do Bot
            </CardTitle>
            <CardDescription>
              Informações sobre taxas e limites
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <p className="text-sm text-muted-foreground">Taxa de Depósito</p>
                <p className="text-2xl font-bold text-emerald-500">5%</p>
              </div>
              <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <p className="text-sm text-muted-foreground">Taxa de Saque</p>
                <p className="text-2xl font-bold text-blue-500">R$ 7,00</p>
              </div>
              <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <p className="text-sm text-muted-foreground">Depósito Mínimo</p>
                <p className="text-2xl font-bold text-amber-500">R$ 10,00</p>
              </div>
              <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <p className="text-sm text-muted-foreground">Saque Mínimo</p>
                <p className="text-2xl font-bold text-purple-500">R$ 20,00</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Como Usar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Como Usar o Bot</CardTitle>
            <CardDescription>Passo a passo para começar</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-4 items-start">
                <Badge className="h-8 w-8 rounded-full flex items-center justify-center bg-primary text-primary-foreground shrink-0">1</Badge>
                <div>
                  <h4 className="font-semibold">Abra o Bot no Telegram</h4>
                  <p className="text-sm text-muted-foreground">Clique no botao &quot;Abrir no Telegram&quot; acima ou pesquise por {botUsername}</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <Badge className="h-8 w-8 rounded-full flex items-center justify-center bg-primary text-primary-foreground shrink-0">2</Badge>
                <div>
                  <h4 className="font-semibold">Inicie o Bot</h4>
                  <p className="text-sm text-muted-foreground">Clique em &quot;Iniciar&quot; ou envie o comando /start para começar</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <Badge className="h-8 w-8 rounded-full flex items-center justify-center bg-primary text-primary-foreground shrink-0">3</Badge>
                <div>
                  <h4 className="font-semibold">Entre nos Canais Obrigatórios</h4>
                  <p className="text-sm text-muted-foreground">O bot irá solicitar que você entre em nossos canais oficiais</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <Badge className="h-8 w-8 rounded-full flex items-center justify-center bg-primary text-primary-foreground shrink-0">4</Badge>
                <div>
                  <h4 className="font-semibold">Pronto para Usar!</h4>
                  <p className="text-sm text-muted-foreground">Agora você pode depositar, sacar e gerenciar seu saldo pelo Telegram</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
