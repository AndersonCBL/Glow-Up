"use client";

import { useState } from "react";
import { Loader2, Copy, Check, Sparkles, Instagram, Video, MessageCircle, Mic, Type, Eye, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/ModeToggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface GeneratedContent {
  insta_caption: string;
  reels_script: string | Record<string, unknown>;
  wa_message: string;
}

export default function Home() {
  const [procedure, setProcedure] = useState("");
  const [tone, setTone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<GeneratedContent | null>(null);
  const [error, setError] = useState("");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!procedure || !tone) return;

    setIsLoading(true);
    setError("");
    setResults(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ procedure, tone }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao gerar o conteúdo.");
      }

      setResults(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ocorreu um erro inesperado.");
    } finally {
      setIsLoading(false);
    }
  };

  const translateKey = (key: string) => {
    const translations: Record<string, string> = {
      'visual_ideas': 'Ideias Visuais',
      'text_on_screen': 'Texto na Tela',
      'voice_over_script': 'Locução (Áudio)',
      'visual': 'Visual',
      'audio': 'Áudio',
      'caption': 'Legenda'
    };
    
    const normalizedKey = key.toLowerCase().trim();
    if (translations[normalizedKey]) {
      return translations[normalizedKey];
    }
    
    return key.replace(/_/g, ' ');
  };

  const getIconForKey = (key: string) => {
    const normalizedKey = key.toLowerCase().trim();
    if (normalizedKey.includes('visual') || normalizedKey.includes('cena')) return <Eye className="w-4 h-4 mr-2" />;
    if (normalizedKey.includes('voice') || normalizedKey.includes('audio') || normalizedKey.includes('locução')) return <Mic className="w-4 h-4 mr-2" />;
    if (normalizedKey.includes('text') || normalizedKey.includes('texto')) return <Type className="w-4 h-4 mr-2" />;
    return <Video className="w-4 h-4 mr-2" />;
  };

  const copyToClipboard = (text: string | Record<string, unknown>, field: string) => {
    let textToCopy = "";
    if (typeof text === 'string') {
      textToCopy = text;
    } else if (typeof text === 'object' && text !== null) {
      textToCopy = Object.entries(text)
        .map(([key, value]) => {
          // Se for array (ex: cenas), formata como lista legível
          if (Array.isArray(value)) {
            const formattedList = value.map((item, index) => {
              if (typeof item === 'object' && item !== null) {
                const itemDetails = Object.entries(item)
                  .map(([subKey, subValue]) => `  • ${subKey.replace(/_/g, ' ').toUpperCase()}: ${subValue}`)
                  .join('\n');
                return `Cena ${index + 1}:\n${itemDetails}`;
              }
              return `${index + 1}. ${item}`;
            }).join('\n\n');
            return `--- ${translateKey(key).toUpperCase()} ---\n${formattedList}`;
          }
          
          const displayValue = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
          return `--- ${translateKey(key).toUpperCase()} ---\n${displayValue}`;
        })
        .join('\n\n');
    }

    navigator.clipboard.writeText(textToCopy);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const renderReelsScript = (script: string | Record<string, unknown>) => {
    if (typeof script === 'string') {
      return script;
    }
    
    if (typeof script === 'object' && script !== null) {
      return (
        <div className="space-y-6">
          {Object.entries(script).map(([key, value]) => {
            const translatedKey = translateKey(key);
            const isVisualIdeas = key.toLowerCase().includes('visual');
            const isTextOverlay = key.toLowerCase().includes('text');
            
            return (
              <div key={key} className="bg-white/40 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm">
                <h4 className="text-sm font-bold text-[#E7A1B0] mb-3 uppercase tracking-wider flex items-center">
                  {getIconForKey(key)}
                  {translatedKey}
                </h4>
                
                <div className="text-slate-700 dark:text-slate-300">
                  {/* Tratamento para Strings Simples com quebras de linha (comum em Ideias Visuais) */}
                  {typeof value === 'string' && isVisualIdeas && value.includes('Cena') ? (
                    <div className="space-y-3 pl-2 border-l-2 border-[#E7A1B0]/30 ml-2">
                      {value.split(/(?=Cena \d+:|Início:|Final:)/i).map((cena, i) => (
                        <div key={i} className="flex gap-3">
                          <span className="text-[#E7A1B0] mt-1"><Clock className="w-3 h-3" /></span>
                          <p className="text-sm leading-relaxed">{cena.trim()}</p>
                        </div>
                      ))}
                    </div>
                  ) : typeof value === 'string' && isTextOverlay && value.includes('?') ? (
                    <div className="space-y-2">
                      {value.split(/(?=\b[A-Z])/).filter(t => t.length > 3).map((texto, i) => (
                         <div key={i} className="bg-[#E7A1B0]/10 dark:bg-[#E7A1B0]/5 px-3 py-2 rounded-lg border-l-2 border-[#E7A1B0] text-sm">
                           &quot;{texto.trim()}&quot;
                         </div>
                      ))}
                    </div>
                  ) : Array.isArray(value) ? (
                    <div className="space-y-4">
                      {value.map((item, index) => (
                        <div key={index} className="bg-white/50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-100 dark:border-slate-800">
                          <h5 className="font-bold text-[#E7A1B0] mb-2 flex items-center gap-2">
                            <Video className="w-4 h-4" /> Cena {index + 1}
                          </h5>
                          {typeof item === 'object' && item !== null ? (
                            <div className="space-y-2 text-sm">
                              {Object.entries(item).map(([subKey, subValue]) => (
                                <p key={subKey} className="leading-relaxed">
                                  <strong className="text-slate-900 dark:text-slate-100 capitalize">{subKey.replace(/_/g, ' ')}:</strong> {String(subValue)}
                                </p>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm leading-relaxed">{String(item)}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{String(value)}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    return "Formato de roteiro não suportado.";
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-[#E7A1B0]/30 font-sans flex flex-col items-center py-12 px-6 md:px-12 relative overflow-hidden transition-colors duration-300">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#E7A1B0]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[40%] bg-slate-900/5 dark:bg-white/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Top Bar Actions */}
      <div className="w-full max-w-6xl flex justify-end mb-4 z-20">
        <ModeToggle />
      </div>

      {/* Header */}
      <header className="w-full max-w-6xl mb-12 text-center md:text-left z-10">
        <h1 className="text-4xl md:text-5xl font-serif tracking-tight flex items-center justify-center md:justify-start gap-3">
          Glow-Up <span className="text-[#E7A1B0] font-semibold flex items-center">Content Express <Sparkles className="ml-2 w-8 h-8" /></span>
        </h1>
        <p className="text-slate-900 dark:text-slate-100 mt-3 text-lg font-light max-w-2xl font-sans">
          Seu assistente de marketing de luxo. Gere legendas, roteiros e mensagens personalizadas em segundos.
        </p>
      </header>

      {/* Main Content Grid */}
      <main className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 z-10">
        
        {/* Left Column: Input Form */}
        <section className="col-span-1 lg:col-span-4 flex flex-col gap-6">
          <Card className="glass-panel text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/50 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-xl font-serif tracking-wide">Descreva a Magia</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-900 dark:text-slate-100 font-sans">
                  Qual é o procedimento ou pacote?
                </label>
                <Textarea
                  placeholder="Ex: Harmonização Facial focada em naturalidade com fios de PDO..."
                  value={procedure}
                  onChange={(e) => setProcedure(e.target.value)}
                  className="bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 min-h-[120px] resize-none focus-visible:ring-[#E7A1B0] font-sans"
                />
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-900 dark:text-slate-100 font-sans">
                  Tom de voz desejado
                </label>
                <Select value={tone} onValueChange={(val) => setTone(val || "")}>
                  <SelectTrigger className="bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:ring-[#E7A1B0] font-sans w-full h-auto min-h-[2.5rem] py-2 whitespace-normal text-left">
                    <SelectValue placeholder="Selecione o tom..." className="font-sans break-words whitespace-normal" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-sans max-w-[calc(100vw-3rem)] sm:max-w-none backdrop-blur-md">
                    <SelectItem value="Elegante e Sofisticado" className="font-sans whitespace-normal py-2">Elegante & Sofisticado</SelectItem>
                    <SelectItem value="Persuasivo e Focado em Vendas" className="font-sans whitespace-normal py-2">Persuasivo & Focado em Vendas</SelectItem>
                    <SelectItem value="Acolhedor e Empático" className="font-sans whitespace-normal py-2">Acolhedor & Empático</SelectItem>
                    <SelectItem value="Educativo e Autoridade" className="font-sans whitespace-normal py-2">Educativo & Autoridade</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={isLoading || !procedure || !tone}
                className="relative overflow-hidden w-full bg-[#E7A1B0] hover:bg-[#d68a9a] text-slate-950 font-semibold h-12 rounded-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed group font-sans"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Criando Conteúdo...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    Gerar Conteúdo
                    <div className="absolute inset-0 -translate-x-full group-hover:animate-shimmer bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                  </>
                )}
              </Button>

              {error && (
                <p className="text-red-400 text-sm mt-2 text-center bg-red-400/10 p-3 rounded-lg border border-red-400/20">
                  {error}
                </p>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Right Column: Results */}
        <section className="col-span-1 lg:col-span-8 flex flex-col gap-6">
          {/* Loading State Placeholder */}
          {isLoading && (
            <Card className="glass-panel text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-2xl min-h-[400px] flex flex-col items-center justify-center space-y-6 bg-white dark:bg-slate-900/50 backdrop-blur-md">
              <div className="relative flex items-center justify-center">
                <div className="absolute w-24 h-24 border-4 border-[#E7A1B0]/30 rounded-full animate-ping" />
                <Loader2 className="w-12 h-12 text-[#E7A1B0] animate-spin" />
              </div>
              <p className="text-slate-900 dark:text-slate-100 text-lg animate-pulse font-sans">
                A inteligência artificial está moldando seu conteúdo de luxo...
              </p>
            </Card>
          )}

          {/* Empty State */}
          {!isLoading && !results && (
            <Card className="glass-panel text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-2xl min-h-[400px] flex flex-col items-center justify-center opacity-60 bg-white dark:bg-slate-900/50 backdrop-blur-md">
              <Sparkles className="w-16 h-16 text-slate-400 dark:text-slate-500 mb-4" />
              <p className="text-slate-900 dark:text-slate-100 text-lg text-center max-w-md px-6 font-sans">
                Preencha os detalhes à esquerda para gerar conteúdos exclusivos e sofisticados para sua clínica.
              </p>
            </Card>
          )}

          {/* Results State */}
          {!isLoading && results && (
            <div className="w-full animate-fade-in-up">
              <Tabs defaultValue="instagram" className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-1 mb-6 backdrop-blur-md">
                  <TabsTrigger value="instagram" className="rounded-lg data-[state=active]:bg-[#E7A1B0] data-[state=active]:text-slate-950 transition-all text-slate-900 dark:text-slate-100">
                    <Instagram className="w-4 h-4 mr-2" /> <span className="hidden sm:inline">Instagram</span>
                  </TabsTrigger>
                  <TabsTrigger value="reels" className="rounded-lg data-[state=active]:bg-[#E7A1B0] data-[state=active]:text-slate-950 transition-all text-slate-900 dark:text-slate-100">
                    <Video className="w-4 h-4 mr-2" /> <span className="hidden sm:inline">Reels</span>
                  </TabsTrigger>
                  <TabsTrigger value="whatsapp" className="rounded-lg data-[state=active]:bg-[#E7A1B0] data-[state=active]:text-slate-950 transition-all text-slate-900 dark:text-slate-100">
                    <MessageCircle className="w-4 h-4 mr-2" /> <span className="hidden sm:inline">WhatsApp</span>
                  </TabsTrigger>
                </TabsList>

                {/* Instagram Content */}
                <TabsContent value="instagram">
                  <Card className="glass-panel text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/50 backdrop-blur-md">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-lg font-serif flex items-center">
                        <Instagram className="w-5 h-5 mr-2 text-[#E7A1B0]" /> Legenda para o Feed
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(results.insta_caption, 'insta')}
                        className="text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10"
                      >
                        {copiedField === 'insta' ? <Check className="w-4 h-4 text-green-500 dark:text-green-400" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-xl border border-slate-200 dark:border-slate-800 whitespace-pre-wrap leading-relaxed text-slate-900 dark:text-slate-100 font-sans">
                        {results.insta_caption}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Reels Content */}
                <TabsContent value="reels">
                  <Card className="glass-panel text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/50 backdrop-blur-md">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-lg font-serif flex items-center">
                        <Video className="w-5 h-5 mr-2 text-[#E7A1B0]" /> Roteiro de Vídeo (Reels/TikTok)
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(results.reels_script, 'reels')}
                        className="text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10"
                      >
                        {copiedField === 'reels' ? <Check className="w-4 h-4 text-green-500 dark:text-green-400" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-xl border border-slate-200 dark:border-slate-800 whitespace-pre-wrap leading-relaxed text-slate-900 dark:text-slate-100 font-sans">
                        {renderReelsScript(results.reels_script)}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* WhatsApp Content */}
                <TabsContent value="whatsapp">
                  <Card className="glass-panel text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/50 backdrop-blur-md">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-lg font-serif flex items-center">
                        <MessageCircle className="w-5 h-5 mr-2 text-[#E7A1B0]" /> Mensagem de Relacionamento
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(results.wa_message, 'wa')}
                        className="text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10"
                      >
                        {copiedField === 'wa' ? <Check className="w-4 h-4 text-green-500 dark:text-green-400" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-xl border border-slate-200 dark:border-slate-800 whitespace-pre-wrap leading-relaxed text-slate-900 dark:text-slate-100 font-sans">
                        {results.wa_message}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
