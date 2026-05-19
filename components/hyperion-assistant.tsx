"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { X, Send, Loader2, Minimize2, Maximize2 } from "lucide-react"
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
      content: "Ola! Eu sou o Hyperion, seu assistente virtual. Como posso te ajudar hoje?"
    }
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Focus input when chat opens
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

      // Add empty assistant message that will be updated
      setMessages(prev => [...prev, { role: "assistant", content: "" }])

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          assistantMessage += chunk
          
          // Update the last message with streamed content
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
        content: "Desculpe, ocorreu um erro. Tente novamente em alguns instantes."
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const quickQuestions = [
    "Como fazer um PIX?",
    "Quais sao as taxas?",
    "Como sacar meu saldo?",
    "O que e KYC?"
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
          "bg-gradient-to-br from-primary to-primary/80",
          "shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40",
          "transition-all duration-300 hover:scale-110",
          "flex items-center justify-center",
          "border-2 border-primary/20",
          isOpen && "hidden"
        )}
        title="Assistente Hyperion"
      >
        <div className="relative w-12 h-12 rounded-full overflow-hidden bg-white/10">
          <Image
            src="/mascote.png"
            alt="Hyperion Mascote"
            fill
            className="object-cover scale-110"
          />
        </div>
        {/* Pulse animation */}
        <span className="absolute inset-0 rounded-full bg-primary/30 animate-ping" />
        
        {/* Tooltip */}
        <div className="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-foreground text-background text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Precisa de ajuda?
        </div>
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div
          className={cn(
            "fixed z-50 transition-all duration-300",
            isMinimized
              ? "bottom-6 right-6 w-72"
              : "bottom-6 right-6 w-96 h-[550px]",
            "bg-background border border-border rounded-2xl shadow-2xl",
            "flex flex-col overflow-hidden"
          )}
        >
          {/* Header */}
          <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
            <div className="relative w-10 h-10 rounded-full overflow-hidden bg-white/20 flex-shrink-0">
              <Image
                src="/mascote.png"
                alt="Hyperion"
                fill
                className="object-cover scale-110"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm">Assistente Hyperion</h3>
              <p className="text-xs text-primary-foreground/80">
                {isLoading ? "Digitando..." : "Online"}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
              >
                {isMinimized ? (
                  <Maximize2 className="w-4 h-4" />
                ) : (
                  <Minimize2 className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages */}
              <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                <div className="space-y-4">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={cn(
                        "flex gap-2",
                        message.role === "user" ? "justify-end" : "justify-start"
                      )}
                    >
                      {message.role === "assistant" && (
                        <div className="relative w-8 h-8 rounded-full overflow-hidden bg-primary/10 flex-shrink-0">
                          <Image
                            src="/mascote.png"
                            alt="Hyperion"
                            fill
                            className="object-cover scale-110"
                          />
                        </div>
                      )}
                      <div
                        className={cn(
                          "max-w-[80%] rounded-2xl px-4 py-2 text-sm",
                          message.role === "user"
                            ? "bg-primary text-primary-foreground rounded-br-sm"
                            : "bg-muted text-foreground rounded-bl-sm"
                        )}
                      >
                        {message.content || (
                          <span className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                            <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                            <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Quick Questions (only show if few messages) */}
              {messages.length <= 2 && (
                <div className="px-4 pb-2">
                  <p className="text-xs text-muted-foreground mb-2">Perguntas rapidas:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {quickQuestions.map((q, i) => (
                      <button
                        key={i}
                        onClick={() => setInput(q)}
                        className="text-xs px-2.5 py-1 rounded-full bg-muted hover:bg-muted/80 transition-colors"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input */}
              <form onSubmit={handleSubmit} className="p-4 border-t border-border">
                <div className="flex gap-2">
                  <Input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Digite sua mensagem..."
                    disabled={isLoading}
                    className="flex-1 rounded-full bg-muted border-0 focus-visible:ring-1 focus-visible:ring-primary"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={isLoading || !input.trim()}
                    className="rounded-full w-10 h-10 flex-shrink-0"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </form>
            </>
          )}
        </div>
      )}
    </>
  )
}
