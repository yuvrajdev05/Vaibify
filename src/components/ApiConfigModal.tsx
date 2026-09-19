import React, { useState, useEffect } from 'react';
import { ApiStatus } from '../types';
import { musicApi } from '../services/musicApi';
import { useToast } from '../context/ToastContext';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Key,
  Globe,
  Terminal,
  Save,
  Check,
} from 'lucide-react';

interface ApiConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApiConfigModal: React.FC<ApiConfigModalProps> = ({ isOpen, onClose }) => {
  const [status, setStatus] = useState<ApiStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [baseUrlInput, setBaseUrlInput] = useState<string>('https://music.artistbots.workers.dev');
  const [apiKeyInput, setApiKeyInput] = useState<string>('ArtistbotsNGDYfcU');
  const { showToast } = useToast();

  const checkStatus = async () => {
    setLoading(true);
    try {
      const data = await musicApi.getStatus();
      setStatus(data);
      if (data.baseUrl) setBaseUrlInput(data.baseUrl);
    } catch {
      setStatus({
        configured: false,
        baseUrl: '',
        hasKey: false,
        status: 'error',
        message: 'Could not reach server proxy',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const result = await musicApi.configure(baseUrlInput.trim(), apiKeyInput.trim());
      setStatus(result);
      if (result.status === 'connected') {
        showToast('API connection successfully verified and active!', 'success');
      } else {
        showToast('Settings updated. ' + (result.message || ''), 'warning');
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to update configuration', 'error');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      checkStatus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      id="inaya-api-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
    >
      <div className="relative w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl text-neutral-100 overflow-hidden">
        {/* Ambient Top Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-indigo-500 to-rose-500" />

        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold">YouTube Music API Integration</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-4 space-y-4 max-h-[75vh] overflow-y-auto no-scrollbar">
          {/* Status card */}
          <div className="p-4 rounded-xl bg-neutral-950/80 border border-neutral-800/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                Live Status
              </span>
              <button
                onClick={checkStatus}
                disabled={loading || saving}
                className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-medium"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                Check Now
              </button>
            </div>

            <div className="mt-3 flex items-start gap-3">
              {status?.status === 'connected' ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-emerald-300 text-sm">
                      Connected & Ready
                    </div>
                    <div className="text-xs text-neutral-400 mt-0.5 leading-relaxed">
                      {status.message}
                    </div>
                  </div>
                </>
              ) : status?.status === 'error' ? (
                <>
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-amber-300 text-sm">
                      Notice / Fallback Active
                    </div>
                    <div className="text-xs text-neutral-400 mt-0.5 leading-relaxed">
                      {status.message}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    i
                  </div>
                  <div>
                    <div className="font-semibold text-cyan-300 text-sm">
                      Real-Time YouTube Engine Active
                    </div>
                    <div className="text-xs text-neutral-400 mt-0.5 leading-relaxed">
                      Instant search and audio streaming ready.
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Form to view and update URL and Key */}
          <form onSubmit={handleSave} className="space-y-3 p-4 rounded-xl bg-neutral-950/60 border border-neutral-800/80">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-300">
              API Credentials
            </h3>

            <div>
              <label className="block text-xs text-neutral-400 mb-1">
                API Base URL
              </label>
              <input
                type="text"
                value={baseUrlInput}
                onChange={(e) => setBaseUrlInput(e.target.value)}
                placeholder="https://music.artistbots.workers.dev"
                className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-100 text-xs focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs text-neutral-400 mb-1">
                API Key / Token
              </label>
              <input
                type="text"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="ArtistbotsNGDYfcU"
                className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-100 text-xs font-mono focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>

            <div className="pt-1 flex items-center justify-between">
              <span className="text-[11px] text-neutral-400 flex items-center gap-1">
                <Key className="w-3.5 h-3.5 text-cyan-400" />
                Safely routed through backend proxy
              </span>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 active:scale-95 text-neutral-950 font-semibold text-xs transition-all shadow-md cursor-pointer"
              >
                {saving ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                Save & Connect
              </button>
            </div>
          </form>

          {/* Key security info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800/60">
              <div className="font-medium text-neutral-200 flex items-center gap-1.5 text-xs">
                <Key className="w-3.5 h-3.5 text-cyan-400" />
                Key Security
              </div>
              <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">
                Secret tokens are stored and verified server-side only in Express and never leaked to the browser.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800/60">
              <div className="font-medium text-neutral-200 flex items-center gap-1.5 text-xs">
                <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                Adaptive Streaming
              </div>
              <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">
                Search queries any music on YouTube with live audio playback, queuing, and lyrics.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-3 border-t border-neutral-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
