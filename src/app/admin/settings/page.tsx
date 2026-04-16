'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { getSiteSettings, updateSiteSettings, SiteSettings, isSupabaseConfigured } from '@/lib/services/config';
import { 
  ShieldCheck, 
  Settings, 
  Globe, 
  Cpu, 
  Database, 
  Key, 
  Lock, 
  Eye, 
  EyeOff,
  CloudLightning,
  Save,
  RotateCcw,
  Zap,
  AlertTriangle,
  Sparkles,
  Terminal
} from 'lucide-react';
import { GEMINI_MODELS, GeminiModel } from '@/lib/gemini/client';

const LS_KEYS = {
  model: 'fr_ai_model',
  openaiApiKey: 'fr_openai_api_key',
  anthropicApiKey: 'fr_anthropic_api_key',
  groqApiKey: 'fr_groq_api_key',
} as const;

function getStoredModel(): GeminiModel {
  if (typeof window === 'undefined') return 'gemini-2.0-flash';
  const stored = localStorage.getItem(LS_KEYS.model);
  if (stored && GEMINI_MODELS.some(m => m.value === stored)) {
    return stored as GeminiModel;
  }
  return 'gemini-2.0-flash';
}

export default function AdminSettings() {
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');
  const [isConnected, setIsConnected] = useState(false);
  const [showConfigWarning, setShowConfigWarning] = useState(false);

  // Local Developer Overrides
  const [selectedModel, setSelectedModel] = useState<GeminiModel>('gemini-2.0-flash');
  const [localKeys, setLocalKeys] = useState({ openai: '', anthropic: '', groq: '' });
  const [localSaveStatus, setLocalSaveStatus] = useState<'idle' | 'saved'>('idle');
  const [resettingRation, setResettingRation] = useState(false);

  // SaaS Keys (State management for the Command Center)
  const [keys, setKeys] = useState({
    googleMaps: '',
    gemini: '',
    supabaseUrl: '',
    supabaseAnon: '',
    redisUrl: '',
    redisToken: '',
    fbApiKey: '',
    fbAuthDomain: '',
    fbProjectId: '',
    fbAppId: '',
    aiProvider: 'gemini' as 'gemini' | 'openrouter',
    orKey: '',
    orModel: ''
  });

  useEffect(() => {
    async function loadSettings() {
      const configured = isSupabaseConfigured();
      setIsConnected(configured);
      setShowConfigWarning(!configured);
      
      const settings = await getSiteSettings();
      setKeys({
        googleMaps: settings.google_maps_api_key || '',
        gemini: settings.gemini_api_key || '',
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        supabaseAnon: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        redisUrl: settings.redis_url || '',
        redisToken: settings.redis_token || '',
        fbApiKey: settings.firebase_api_key || '',
        fbAuthDomain: settings.firebase_auth_domain || '',
        fbProjectId: settings.firebase_project_id || '',
        fbAppId: settings.firebase_app_id || '',
        aiProvider: settings.ai_provider || 'gemini',
        orKey: '',
        orModel: settings.openrouter_model || ''
      });
      setSelectedModel(getStoredModel());
      if (typeof window !== 'undefined') {
        setLocalKeys({
          openai: localStorage.getItem(LS_KEYS.openaiApiKey) || '',
          anthropic: localStorage.getItem(LS_KEYS.anthropicApiKey) || '',
          groq: localStorage.getItem(LS_KEYS.groqApiKey) || ''
        });
      }
    }
    loadSettings();
  }, []);

  const handleSaveLocal = () => {
    localStorage.setItem(LS_KEYS.model, selectedModel);
    localStorage.setItem(LS_KEYS.openaiApiKey, localKeys.openai);
    localStorage.setItem(LS_KEYS.anthropicApiKey, localKeys.anthropic);
    localStorage.setItem(LS_KEYS.groqApiKey, localKeys.groq);
    setLocalSaveStatus('saved');
    setTimeout(() => setLocalSaveStatus('idle'), 2000);
  };

  const handleResetRation = () => {
    setResettingRation(true);
    try {
      const { useRationStore } = require('@/stores');
      const store = useRationStore.getState();
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      useRationStore.setState({
        usedToday: 0,
        visitsToday: 0,
        lastResetDate: yesterday,
        litersRemaining: store.dailyLimit,
        visitedStations: [],
        visitedStationIds: new Set(),
      });
    } catch (e) {
      console.error('Failed to reset ration:', e);
    }
    setTimeout(() => {
      setResettingRation(false);
      setLocalSaveStatus('saved');
      setTimeout(() => setLocalSaveStatus('idle'), 2000);
    }, 500);
  };

  const toggleKey = (key: string) => {
    setShowKeys(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    const result = await updateSiteSettings({
      google_maps_api_key: keys.googleMaps,
      gemini_api_key: keys.gemini,
      redis_url: keys.redisUrl,
      redis_token: keys.redisToken,
      firebase_api_key: keys.fbApiKey,
      firebase_auth_domain: keys.fbAuthDomain,
      firebase_project_id: keys.fbProjectId,
      firebase_app_id: keys.fbAppId,
      ai_provider: keys.aiProvider,
      openrouter_api_key: keys.orKey,
      openrouter_model: keys.orModel
    });

    setIsSaving(false);
    if (result.success) {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } else {
      alert('Failed to save settings: ' + result.error);
    }
  };

  return (
    <div className="space-y-10 animate-page-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-display font-bold text-white tracking-tight">SaaS Config</h1>
            <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-colors ${
              isConnected ? 'bg-success/10 text-success border-success/20' : 'bg-danger/10 text-danger border-danger/20'
            }`}>
              {isConnected ? '● Connected' : '● System Offline'}
            </div>
          </div>
          <p className="text-sm text-text-muted">
            Centralized infrastructure management. Updates propagate across all platform instances.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="ghost" className="text-text-muted hover:text-white">
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset Defaults
          </Button>
          <Button 
            onClick={handleSave} 
            loading={isSaving}
            className="shadow-glow-orange min-w-[140px]"
          >
            {saveStatus === 'saved' ? (
              <span className="flex items-center gap-2 animate-bounce-in">
                <ShieldCheck className="w-4 h-4" />
                Deployed!
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Save className="w-4 h-4" />
                Apply Changes
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Connection Warning */}
      {showConfigWarning && (
        <div className="bg-danger/10 border border-danger/20 rounded-2xl p-6 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex gap-4">
            <div className="w-12 h-12 bg-danger/20 rounded-xl flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6 text-danger" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white tracking-tight">Configuration Required</h3>
              <p className="text-sm text-text-secondary leading-relaxed max-w-2xl">
                The platform is currently using placeholder Supabase credentials. You must update your <code className="bg-white/5 px-1 rounded text-primary">.env.local</code> file with your actual Supabase project URL and Anon key to enable persistent settings.
              </p>
              <div className="pt-2 flex gap-4">
                <div className="flex flex-col">
                  <span className="text-[10px] text-text-muted uppercase font-bold">Current URL</span>
                  <span className="text-xs font-mono text-danger/80">{keys.supabaseUrl}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Core Infrastructure Controls */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <CloudLightning className="w-5 h-5 text-accent" />
              <h2 className="text-xl font-display font-bold text-white tracking-tight">Core Infrastructure</h2>
            </div>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={handleSave} 
              loading={isSaving}
              className="text-[10px] font-bold uppercase tracking-wider text-text-muted hover:text-primary transition-colors"
            >
              <Save className="w-3.5 h-3.5 mr-2" />
              Quick Save
            </Button>
          </div>

          <div className="p-6 bg-[#111116] border border-white/5 rounded-2xl space-y-8">
            <div className="space-y-4">
              <label className="text-xs font-bold text-text-muted uppercase tracking-widest flex items-center gap-2">
                <Globe className="w-4 h-4 text-primary" />
                Google Maps API (Global)
              </label>
              <div className="relative group/input">
                <Input
                  type={showKeys.gmaps ? 'text' : 'password'}
                  value={keys.googleMaps}
                  onChange={(e) => setKeys({...keys, googleMaps: e.target.value})}
                  className="bg-background/40 border-white/10 font-mono text-sm pr-12"
                />
                <button 
                  onClick={() => toggleKey('gmaps')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-primary transition-colors"
                >
                  {showKeys.gmaps ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <div className="absolute inset-x-0 bottom-[-2px] h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent scale-x-0 group-focus-within/input:scale-x-100 transition-transform duration-500" />
              </div>
              <p className="text-[10px] text-text-muted">Used for static maps, geocoding, and station lookups worldwide.</p>
            </div>

            <div className="space-y-4">
              <label className="text-xs font-bold text-text-muted uppercase tracking-widest flex items-center gap-2">
                <Cpu className="w-4 h-4 text-accent" />
                Gemini AI Engine
              </label>
              <div className="relative group/input">
                <Input
                  type={showKeys.gemini ? 'text' : 'password'}
                  value={keys.gemini}
                  onChange={(e) => setKeys({...keys, gemini: e.target.value})}
                  className="bg-background/40 border-white/10 font-mono text-sm pr-12"
                />
                <button 
                  onClick={() => toggleKey('gemini')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-accent transition-colors"
                >
                  {showKeys.gemini ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-text-muted">Powers route optimization, queue prediction, and fraud detection logic.</p>
            </div>

            <div className="pt-6 border-t border-white/5 space-y-4">
              <label className="text-xs font-bold text-text-muted uppercase tracking-widest flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Active AI Provider
              </label>
              <div className="grid grid-cols-2 gap-3">
                {(['gemini', 'openrouter'] as const).map((prov) => (
                  <button
                    key={prov}
                    onClick={() => setKeys({ ...keys, aiProvider: prov })}
                    className={`px-4 py-3 rounded-2xl border text-[10px] font-bold uppercase transition-all flex flex-col items-center gap-2 ${
                      keys.aiProvider === prov 
                      ? 'bg-primary/20 text-white border-primary shadow-glow-orange' 
                      : 'bg-white/5 text-text-muted border-white/5 hover:bg-white/10'
                    }`}
                  >
                    <span className="text-sm font-display tracking-tight">{prov.charAt(0).toUpperCase() + prov.slice(1)}</span>
                    <span className="opacity-50 font-normal normal-case">{prov === 'gemini' ? 'Direct Engine' : 'Multi-Model Proxy'}</span>
                  </button>
                ))}
              </div>
            </div>

            {keys.aiProvider === 'openrouter' && (
              <div className="space-y-4 pt-4 animate-in slide-in-from-top-2 duration-300">
                <div className="space-y-2">
                   <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">OpenRouter API Key</label>
                   <div className="relative">
                     <Input 
                       type={showKeys.or ? 'text' : 'password'}
                       value={keys.orKey} 
                       onChange={(e) => setKeys({...keys, orKey: e.target.value})}
                       className="bg-background/40 border-white/10 text-xs font-mono pr-10"
                     />
                     <button 
                       onClick={() => toggleKey('or')}
                       className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-white"
                     >
                       {showKeys.or ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                     </button>
                   </div>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Target Model ID</label>
                   <Input 
                     value={keys.orModel} 
                     onChange={(e) => setKeys({...keys, orModel: e.target.value})}
                     className="bg-background/40 border-white/10 text-xs font-mono"
                     placeholder="e.g. mistralai/mistral-7b-instruct"
                   />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Database & Caching Controls */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-success" />
              <h2 className="text-xl font-display font-bold text-white tracking-tight">Storage & Caching</h2>
            </div>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={handleSave} 
              loading={isSaving}
              className="text-[10px] font-bold uppercase tracking-wider text-text-muted hover:text-success transition-colors"
            >
              <Save className="w-3.5 h-3.5 mr-2" />
              Quick Save
            </Button>
          </div>

          <div className="p-6 bg-[#111116] border border-white/5 rounded-2xl space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Supabase REST Endpoint</label>
                <Input value={keys.supabaseUrl} readOnly className="bg-background/20 border-white/5 opacity-50 cursor-not-allowed text-xs" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Supabase Anon Key</label>
                <Input value={keys.supabaseAnon} readOnly className="bg-background/20 border-white/5 opacity-50 cursor-not-allowed text-xs" />
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-white/5">
              <label className="text-xs font-bold text-text-muted uppercase tracking-widest flex items-center gap-2">
                <Zap className="w-4 h-4 text-warning" />
                Real-time Cache (Upstash)
              </label>
              <div className="space-y-3">
                <div className="relative">
                  <Input 
                    value={keys.redisUrl} 
                    className="bg-background/40 border-white/10 text-xs font-mono"
                    onChange={(e) => setKeys({...keys, redisUrl: e.target.value})}
                  />
                  <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted opacity-40" />
                </div>
                <div className="relative">
                  <Input 
                    type={showKeys.redis ? 'text' : 'password'}
                    value={keys.redisToken} 
                    className="bg-background/40 border-white/10 text-xs font-mono pr-12"
                    onChange={(e) => setKeys({...keys, redisToken: e.target.value})}
                  />
                  <button 
                    onClick={() => toggleKey('redis')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-warning"
                  >
                    {showKeys.redis ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-warning/10 border border-warning/20 rounded-xl p-4 mt-4">
               <div className="flex gap-3">
                 <AlertTriangle className="w-5 h-5 text-warning shrink-0" />
                 <p className="text-[11px] text-warning/80 leading-relaxed">
                   <strong>Caution:</strong> Infrastructure changes take approximately 60 seconds to propagate via global CDN cache. Active client sessions may require a background refresh.
                 </p>
               </div>
            </div>
          </div>

          {/* Notifications Infrastructure */}
          <div className="space-y-6 mt-8">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-display font-bold text-white tracking-tight">Notification Infrastructure</h2>
              </div>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={handleSave} 
                loading={isSaving}
                className="text-[10px] font-bold uppercase tracking-wider text-text-muted hover:text-primary transition-colors"
              >
                <Save className="w-3.5 h-3.5 mr-2" />
                Quick Save
              </Button>
            </div>
            <div className="p-6 bg-[#111116] border border-white/5 rounded-2xl space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Firebase API Key</label>
                  <Input 
                    type={showKeys.fb ? 'text' : 'password'}
                    value={keys.fbApiKey} 
                    onChange={(e) => setKeys({...keys, fbApiKey: e.target.value})}
                    className="bg-background/40 border-white/10 text-xs font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Firebase Auth Domain</label>
                  <Input 
                    value={keys.fbAuthDomain} 
                    onChange={(e) => setKeys({...keys, fbAuthDomain: e.target.value})}
                    className="bg-background/40 border-white/10 text-xs font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Firebase Project ID</label>
                  <Input 
                    value={keys.fbProjectId} 
                    onChange={(e) => setKeys({...keys, fbProjectId: e.target.value})}
                    className="bg-background/40 border-white/10 text-xs font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Firebase App ID</label>
                  <Input 
                    value={keys.fbAppId} 
                    onChange={(e) => setKeys({...keys, fbAppId: e.target.value})}
                    className="bg-background/40 border-white/10 text-xs font-mono"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button 
                  onClick={() => toggleKey('fb')}
                  className="text-[10px] text-text-muted hover:text-primary transition-colors flex items-center gap-1"
                >
                  {showKeys.fb ? <><EyeOff className="w-3 h-3" /> Hide Sensitive</> : <><Eye className="w-3 h-3" /> Show API Key</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Developer Overrides (Local Storage) */}
      <div className="space-y-6 pt-8 border-t border-white/5">
        <div className="flex items-center gap-2 px-2">
          <Terminal className="w-5 h-5 text-warning" />
          <h2 className="text-xl font-display font-bold text-white tracking-tight">Developer Testing Overrides</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6 bg-surface/30 border-white/5 space-y-6">
            <div className="space-y-4">
              <label className="text-xs font-bold text-text-muted uppercase tracking-widest flex items-center gap-2">
                <Cpu className="w-4 h-4 text-primary" />
                Local AI Model (Gemini)
              </label>
              <div className="space-y-2">
                {GEMINI_MODELS.map((model) => (
                  <button
                    key={model.value}
                    onClick={() => setSelectedModel(model.value)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-xs ${
                      selectedModel === model.value ? 'bg-primary/20 border-primary/50 text-white' : 'bg-background/40 border-white/5 text-text-muted hover:bg-white/5'
                    }`}
                  >
                    <span>{model.label}</span>
                    {selectedModel === model.value && <div className="w-2 h-2 rounded-full bg-primary" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4 border-t border-white/5 pt-4">
              <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Local Fallback API Keys</label>
              <Input 
                placeholder="OpenAI sk-..." 
                type={showKeys.localOai ? 'text' : 'password'}
                value={localKeys.openai} 
                onChange={e => setLocalKeys({...localKeys, openai: e.target.value})} 
                className="bg-background/40 font-mono text-xs border-white/10" 
              />
              <Input 
                placeholder="Anthropic sk-ant-..." 
                type={showKeys.localAnt ? 'text' : 'password'}
                value={localKeys.anthropic} 
                onChange={e => setLocalKeys({...localKeys, anthropic: e.target.value})} 
                className="bg-background/40 font-mono text-xs border-white/10" 
              />
              <Input 
                placeholder="Groq gsk_..." 
                type={showKeys.localGroq ? 'text' : 'password'}
                value={localKeys.groq} 
                onChange={e => setLocalKeys({...localKeys, groq: e.target.value})} 
                className="bg-background/40 font-mono text-xs border-white/10" 
              />
            </div>
            
            <div className="flex justify-between items-center pt-2">
               <button onClick={() => toggleKey('localOai')} className="text-[10px] text-text-muted flex items-center gap-1 hover:text-white">
                 <Eye className="w-3 h-3" /> Toggle View
               </button>
               <Button size="sm" onClick={handleSaveLocal} variant="secondary" className="text-xs">
                 {localSaveStatus === 'saved' ? 'Saved Locally!' : 'Save Local Config'}
               </Button>
            </div>
          </Card>

          <Card className="p-6 bg-surface/30 border-white/5 space-y-6 flex flex-col justify-start">
            <div>
              <label className="text-xs font-bold text-text-muted uppercase tracking-widest flex items-center gap-2 mb-2">
                <RotateCcw className="w-4 h-4 text-danger" />
                Daily Limit Override
              </label>
              <p className="text-[11px] text-text-muted leading-relaxed mb-4">
                Manually reset your personal ration counters (used today, visits, liters remaining) for testing the fuel UI without waiting for midnight.
              </p>
              <Button onClick={handleResetRation} loading={resettingRation} variant="danger" className="w-full text-xs">
                Reset Personal Ration
              </Button>
            </div>
            <div className="bg-warning/10 border border-warning/20 p-4 rounded-xl mt-auto">
              <div className="flex gap-2">
                <AlertTriangle className="w-4 h-4 text-warning" />
                <p className="text-[10px] text-warning/80">These overrides stick to your local browser session and bypass the global SaaS configuration.</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Bottom Save Bar */}
      <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 pb-20">
        <div className="flex items-center gap-2 text-warning animate-pulse">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Unsaved settings may be lost on refresh.</span>
        </div>
        <Button 
          size="lg"
          onClick={handleSave} 
          loading={isSaving}
          className="w-full md:w-auto shadow-glow-orange min-w-[280px] h-14 text-lg font-display font-black tracking-tight"
        >
          {saveStatus === 'saved' ? (
            <span className="flex items-center gap-3 animate-bounce-in">
              <ShieldCheck className="w-6 h-6" />
              CONFIG DEPLOYED!
            </span>
          ) : (
            <span className="flex items-center gap-3">
              <Save className="w-6 h-6" />
              SAVE & DEPLOY CONFIGURATION
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}
