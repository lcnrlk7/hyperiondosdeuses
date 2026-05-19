"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X, Send, Loader2, Minimize2, Maximize2, Sparkles, MessageCircle, Zap, CreditCard, Wallet, HelpCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"

interface Message {
  role: "user" | "assistant"
  content: string
}

export function HyperionAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Ola! Sou o Assistente Hyperion, estou aqui para te ajudar com qualquer duvida sobre a plataforma Hyperion Pay. O que voce precisa saber?"
    }
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen, isMinimized])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput("")
    setMessages(prev => [...prev, { role: "user", content: userMessage }])
    setIsLoading(true)

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, { role: "user", content: userMessage }]
        })
      })

      if (!response.ok) throw new Error("Failed to get response")

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let assistantMessage = ""

      setMessages(prev => [...prev, { role: "assistant", content: "" }])

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          assistantMessage += chunk
          
          setMessages(prev => {
            const newMessages = [...prev]
            newMessages[newMessages.length - 1] = {
              role: "assistant",
              content: assistantMessage
            }
            return newMessages
          })
        }
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente."
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickQuestion = (question: string) => {
    setInput(question)
    setTimeout(() => {
      const form = document.getElementById("assistant-form") as HTMLFormElement
      if (form) form.requestSubmit()
    }, 100)
  }

  const quickQuestions = [
    { icon: Zap, text: "Como fazer PIX?", color: "text-green-500" },
    { icon: Wallet, text: "Como sacar?", color: "text-blue-500" },
    { icon: CreditCard, text: "Quais as taxas?", color: "text-orange-500" },
    { icon: HelpCircle, text: "O que e KYC?", color: "text-purple-500" },
  ]

  return (
    <>
      {/* Floating Button with Mascot */}
      <button
        onClick={() => {
          setIsOpen(true)
          setIsMinimized(false)
        }}
        className={cn(
          "fixed bottom-6 right-6 z-50 group",
          "w-16 h-16 rounded-full",
          "bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600",
          "shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40",
          "transition-all duration-300 hover:scale-110",
          "flex items-center justify-center",
          "border-2 border-white/20",
          isOpen && "hidden"
        )}
        title="Assistente Hyperion"
      >
        <div className="relative w-12 h-12 rounded-full overflow-hidden">
          <Image
            src="/mascote.png"
            alt="Hyperion Mascote"
            fill
            className="object-cover scale-125"
          />
        </div>
        {/* Pulse animation */}
        <span className="absolute inset-0 rounded-full bg-emerald-400/40 animate-ping" />
        
        {/* Notification dot */}
        <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full border-2 border-white flex items-center justify-center">
          <span className="text-[8px] text-white font-bold">1</span>
        </span>
        
        {/* Tooltip */}
        <div className="absolute bottom-full right-0 mb-3 px-4 py-2 bg-gray-900 text-white text-sm rounded-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-yellow-400" />
            <span>Precisa de ajuda?</span>
          </div>
          <div className="absolute bottom-0 right-6 transform translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900" />
        </div>
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div
          className={cn(
            "fixed z-50 transition-all duration-300 ease-out",
            isMinimized
              ? "bottom-6 right-6 w-80"
              : "bottom-6 right-6 w-[400px] h-[600px]",
            "bg-background rounded-2xl shadow-2xl",
            "flex flex-col overflow-hidden",
            "border border-border/50"
          )}
          style={{
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(16, 185, 129, 0.1)"
          }}
        >
          {/* Header */}
          <div className="relative flex items-center gap-3 p-4 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 text-white overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
              <div className="absolute bottom-0 right-0 w-24 h-24 bg-white rounded-full translate-x-1/2 translate-y-1/2" />
            </div>
            
            <div className="relative w-12 h-12 rounded-full overflow-hidden bg-white/20 flex-shrink-0 ring-2 ring-white/30">
              <Image
                src="/mascote.png"
                alt="Hyperion"
                fill
                className="object-cover scale-125"
              />
            </div>
            <div className="flex-1 min-w-0 relative">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base">Hyperion Assistente</h3>
                <Sparkles className="w-4 h-4 text-yellow-300" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className={cn(
                  "w-2 h-2 rounded-full",
                  isLoading ? "bg-yellow-400 animate-pulse" : "bg-green-300"
                )} />
                <p className="text-xs text-white/90">
                  {isLoading ? "Digitando..." : "Online - Pronto para ajudar"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 relative">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-2 rounded-xl hover:bg-white/20 transition-colors"
              >
                {isMinimized ? (
                  <Maximize2 className="w-4 h-4" />
                ) : (
                  <Minimize2 className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-xl hover:bg-white/20 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-muted/30 to-background" ref={scrollRef}>
                <div className="space-y-4">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={cn(
                        "flex gap-3",
                        message.role === "user" ? "justify-end" : "justify-start"
                      )}
                    >
                      {message.role === "assistant" && (
                        <div className="relative w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-500 flex-shrink-0 ring-2 ring-emerald-500/20">
                          <Image
                            src="/mascote.png"
                            alt="Hyperion"
                            fill
                            className="object-cover scale-125"
                          />
                        </div>
                      )}
                      <div
                        className={cn(
                          "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                          message.role === "user"
                            ? "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-br-md shadow-lg shadow-emerald-500/20"
                            : "bg-white dark:bg-gray-800 text-foreground rounded-bl-md shadow-md border border-border/50"
                        )}
                      >
                        {message.content || (
                          <span className="flex items-center gap-1.5 py-1">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                          </span>
                        )}
                      </div>
                      {message.role === "user" && (
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center flex-shrink-0 ring-2 ring-gray-600/20">
                          <span className="text-white text-sm font-medium">Eu</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Questions */}
              {messages.length <= 2 && (
                <div className="px-4 pb-3 border-t border-border/50 bg-muted/20">
                  <p className="text-xs text-muted-foreground mb-2 pt-3 flex items-center gap-1">
                    <MessageCircle className="w-3 h-3" />
                    Perguntas frequentes:
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {quickQuestions.map((q, i) => (
                      <button
                        key={i}
                        onClick={() => handleQuickQuestion(q.text)}
                        className="flex items-center gap-2 text-xs px-3 py-2 rounded-xl bg-white dark:bg-gray-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 border border-border/50 hover:border-emerald-500/50 transition-all text-left group"
                      >
                        <q.icon className={cn("w-4 h-4 flex-shrink-0", q.color)} />
                        <span className="text-muted-foreground group-hover:text-foreground transition-colors">{q.text}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input */}
              <form id="assistant-form" onSubmit={handleSubmit} className="p-4 border-t border-border/50 bg-background">
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Input
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Digite sua duvida sobre a Hyperion Pay..."
                      disabled={isLoading}
                      className="w-full rounded-xl bg-muted/50 border-border/50 focus-visible:ring-2 focus-visible:ring-emerald-500/50 focus-visible:border-emerald-500 pr-4 py-5"
                    />
                  </div>
                  <Button
                    type="submit"
                    size="icon"
                    disabled={isLoading || !input.trim()}
                    className="rounded-xl w-11 h-11 flex-shrink-0 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 shadow-lg shadow-emerald-500/20 transition-all hover:scale-105"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground text-center mt-2">
                  Assistente exclusivo para duvidas sobre a Hyperion Pay
                </p>
              </form>
            </>
          )}
        </div>
      )}
    </>
  )
}
