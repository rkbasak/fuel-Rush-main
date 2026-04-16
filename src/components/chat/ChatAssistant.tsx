'use client';

import { useState, useRef, useEffect } from 'react';
import { useChatStore } from '@/stores';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Send, Loader2, X, MapPin, Navigation, Zap } from 'lucide-react';

interface ChatStation {
  id: string;
  name: string;
  address: string;
  status: 'available' | 'low' | 'queue' | 'empty' | 'unknown';
  confidence: number;
  distance_km: number | null;
}

interface ChatResponse {
  response: string;
  intent: string;
  parsed_query: Record<string, unknown>;
  stations: ChatStation[];
  count: number;
}

const SUGGESTED_QUERIES = [
  { icon: '⛽', text: 'Stations with fuel nearby' },
  { icon: '🗺️', text: 'Best route to Gulshan' },
  { icon: '📊', text: 'My ration status' },
  { icon: '🔍', text: 'Search Dhanmondi stations' },
];

export function ChatAssistant() {
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, isLoading, addMessage, setLoading, clearMessages } = useChatStore();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (query?: string) => {
    const q = query || input.trim();
    if (!q || isLoading) return;

    setInput('');
    setShowSuggestions(false);
    addMessage({ role: 'user', content: q });
    setLoading(true);

    try {
      // Read model preference from localStorage
      const modelPref = typeof window !== 'undefined'
        ? localStorage.getItem('fr_ai_model') || ''
        : '';

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (modelPref) headers['x-gemini-model'] = modelPref;

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({ query: q }),
      });

      const data = await res.json();

      if (data.error) {
        addMessage({ role: 'assistant', content: `Error: ${data.error}` });
        return;
      }

      const { response, stations } = data.data as ChatResponse;
      addMessage({
        role: 'assistant',
        content: response,
        stations: (stations as ChatStation[] | undefined) ?? [],
      });
    } catch {
      addMessage({ role: 'assistant', content: 'Sorry, I couldn\'t process that query. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      available: 'text-success', 
      low: 'text-warning',
      queue: 'text-primary', 
      empty: 'text-danger', 
      unknown: 'text-neutral',
    };
    return colors[status] || colors.unknown;
  };

  const getStatusBg = (status: string) => {
    const colors: Record<string, string> = {
      available: 'bg-success/20', 
      low: 'bg-warning/20',
      queue: 'bg-primary/20', 
      empty: 'bg-danger/20', 
      unknown: 'bg-neutral/20',
    };
    return colors[status] || colors.unknown;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      available: 'Available', 
      low: 'Low Stock',
      queue: 'Queue', 
      empty: 'Empty', 
      unknown: 'Unknown',
    };
    return labels[status] || labels.unknown;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center">
            <Zap className="w-4 h-4 text-accent" />
          </div>
          <div>
            <span className="font-display font-semibold text-text-primary">Fuel Assistant</span>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
              <span className="text-xs text-text-muted">Online</span>
            </div>
          </div>
        </div>
        {messages.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearMessages}>
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {/* Welcome message */}
        {showSuggestions && messages.length === 0 && (
          <div className="space-y-4 animate-fade-in">
            {/* AI greeting */}
            <div className="flex items-start gap-2">
              <div className="w-6 h-6 bg-accent/20 rounded-full flex items-center justify-center shrink-0 mt-1">
                <Zap className="w-3 h-3 text-accent" />
              </div>
              <div className="bg-surface-elevated rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%]">
                <p className="text-sm text-text-primary leading-relaxed">
                  👋 Hi! I&apos;m your fuel intel assistant. Ask me anything about fuel stations, routes, or your ration!
                </p>
              </div>
            </div>

            {/* Quick suggestions */}
            <div>
              <p className="text-xs text-text-muted mb-2 px-1">Try one of these:</p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_QUERIES.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(q.text)}
                    className="flex items-center gap-2 px-3 py-2 bg-surface-elevated hover:bg-surface rounded-full text-sm text-text-secondary hover:text-text-primary transition-all duration-200 border border-transparent hover:border-primary/30"
                  >
                    <span>{q.icon}</span>
                    <span>{q.text}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Chat messages */}
        {messages.map((msg) => (
          <div key={msg.id} className="space-y-2 animate-page-in">
            {/* User message */}
            <div className="flex justify-end">
              <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-primary px-4 py-2.5 text-sm text-white">
                {msg.content}
              </div>
            </div>

            {/* AI response with stations */}
            {msg.stations && msg.stations.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 bg-accent/20 rounded-full flex items-center justify-center shrink-0 mt-1">
                    <Zap className="w-3 h-3 text-accent" />
                  </div>
                  <div className="bg-surface-elevated rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%]">
                    <p className="text-sm text-text-primary leading-relaxed">{msg.content}</p>
                  </div>
                </div>
                
                {/* Station cards */}
                <div className="ml-8 space-y-2">
                  {msg.stations.slice(0, 5).map((station) => (
                    <Card 
                      key={station.id} 
                      className="p-3 hover:bg-surface transition-colors border-l-2 border-l-primary"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-text-primary text-sm truncate">{station.name}</div>
                          <div className="text-xs text-text-muted flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3" />
                            <span className="truncate">{station.address}</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${getStatusBg(station.status)} ${getStatusColor(station.status)}`}>
                            {getStatusLabel(station.status)}
                          </span>
                          {station.distance_km !== null && (
                            <div className="text-xs text-text-muted flex items-center justify-end gap-1 mt-1">
                              <Navigation className="w-3 h-3" />
                              {station.distance_km < 1 ? `${Math.round(station.distance_km * 1000)}m` : `${station.distance_km.toFixed(1)}km`}
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* AI response without stations */}
            {!msg.stations && msg.role === 'assistant' && (
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 bg-accent/20 rounded-full flex items-center justify-center shrink-0 mt-1">
                  <Zap className="w-3 h-3 text-accent" />
                </div>
                <div className="bg-surface-elevated rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%]">
                  <p className="text-sm text-text-primary leading-relaxed">{msg.content}</p>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex items-center gap-2 text-text-muted animate-fade-in">
            <div className="w-6 h-6 bg-accent/20 rounded-full flex items-center justify-center">
              <Zap className="w-3 h-3 text-accent" />
            </div>
            <div className="flex items-center gap-1 bg-surface-elevated rounded-full px-4 py-3">
              <div className="w-2 h-2 bg-text-muted rounded-full animate-typing-dot" />
              <div className="w-2 h-2 bg-text-muted rounded-full animate-typing-dot" />
              <div className="w-2 h-2 bg-text-muted rounded-full animate-typing-dot" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="px-4 py-3 border-t border-border bg-surface">
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex items-center gap-2">
          <input 
            type="text" 
            value={input} 
            onChange={(e) => setInput(e.target.value)} 
            placeholder="Ask about stations, routes..." 
            className="flex-1 bg-surface-elevated border border-border rounded-full px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" 
            disabled={isLoading} 
          />
          <Button 
            type="submit" 
            size="sm" 
            className="rounded-full w-10 h-10 p-0 shadow-glow-orange" 
            disabled={isLoading || !input.trim()}
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
