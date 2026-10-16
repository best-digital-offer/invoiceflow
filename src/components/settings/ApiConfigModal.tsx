import React, { useState } from 'react';
import { 
  X, 
  Server, 
  CheckCircle2, 
  AlertCircle, 
  Activity, 
 
  Code, 
 
  ShieldCheck,
  RotateCcw
} from 'lucide-react';
import { BackendConfig } from '../../types';
import { InvoiceExtractionService } from '../../services/pdfExtractor';
import { storageService } from '../../services/storage';

interface ApiConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: BackendConfig) => void;
}

export const ApiConfigModal: React.FC<ApiConfigModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [config, setConfig] = useState<BackendConfig>(storageService.getBackendConfig());
  const [testStatus, setTestStatus] = useState<{
    running: boolean;
    success?: boolean;
    message?: string;
    latencyMs?: number;
  }>({ running: false });

  const [activeTab, setActiveTab] = useState<'settings' | 'contract'>('settings');

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setTestStatus({ running: true });
    const res = await InvoiceExtractionService.testBackendConnection('/api');
    setTestStatus({
      running: false,
      success: res.success,
      message: res.message,
      latencyMs: res.latencyMs,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = storageService.saveBackendConfig({ ...config, baseUrl: '/api', apiKey: '' });
    onSave(updated);
    onClose();
  };

  const handleResetToDemo = () => {
    const updated = storageService.saveBackendConfig({
      baseUrl: '/api',
      apiKey: '',
      useLiveBackend: false,
      roundingTolerance: 0.02,
    });
    setConfig(updated);
    setTestStatus({ running: false, success: true, message: 'Local deterministic parser enabled.' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Extraction Engine & API Connector
              </h3>
              <p className="text-xs text-slate-500">
                Check the built-in Vercel extraction API or use local parsing.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 px-6 text-xs font-semibold bg-slate-50/50">
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`py-2.5 px-3 border-b-2 transition-colors ${
              activeTab === 'settings'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Connection Settings
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('contract')}
            className={`py-2.5 px-3 border-b-2 transition-colors flex items-center space-x-1.5 ${
              activeTab === 'contract'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>Documented API Contract</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 text-xs">
          {activeTab === 'settings' ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Engine Mode Toggle */}
              <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900">
                      Vercel API Routing
                    </div>
                    <p className="text-slate-500 text-[11px]">
                      When enabled, selectable PDF text is sent to InvoiceFlow's built-in Vercel API.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.useLiveBackend}
                      onChange={e => setConfig(prev => ({ ...prev, useLiveBackend: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {!config.useLiveBackend && (
                  <div className="p-2.5 bg-amber-50 rounded border border-amber-200 text-amber-800 text-[11px]">
                    <strong>In-Browser Mode Active:</strong> Invoices are parsed client-side using deterministic regex and mathematical formulas without external backend dependencies.
                  </div>
                )}
              </div>

              {/* Fixed same-origin Vercel API */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Extraction API
                </label>
                <div className="flex space-x-2">
                  <div className="flex-1 px-3 py-2 rounded border border-slate-200 bg-slate-50 font-mono text-xs text-slate-700">
                    /api/extract
                  </div>
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={testStatus.running}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded font-medium text-xs flex items-center space-x-1 shrink-0 transition-colors disabled:opacity-50"
                  >
                    <Activity className={`w-3.5 h-3.5 ${testStatus.running ? 'animate-spin' : ''}`} />
                    <span>{testStatus.running ? 'Testing...' : 'Test Connection'}</span>
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Fixed to this Vercel deployment. No external backend URL or browser-stored API secret is used.</p>
              </div>

              {/* Test Status feedback */}
              {testStatus.message && (
                <div className={`p-3 rounded-lg border text-xs flex items-start space-x-2 ${
                  testStatus.success 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}>
                  {testStatus.success ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  )}
                  <div>
                    <p className="font-semibold">{testStatus.message}</p>
                    {testStatus.latencyMs !== undefined && (
                      <p className="text-[10px] text-slate-500 mt-0.5">Latency: {testStatus.latencyMs} ms</p>
                    )}
                  </div>
                </div>
              )}

              {/* Rounding Tolerance */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Rounding Tolerance ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={config.roundingTolerance}
                    onChange={e => setConfig(prev => ({ ...prev, roundingTolerance: parseFloat(e.target.value) || 0.02 }))}
                    className="w-full px-3 py-2 rounded border border-slate-300 font-mono text-xs"
                  />
                  <p className="text-[10px] text-slate-500 mt-0.5">Allowed variance for currency cent rounding (default $0.02)</p>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Timeout (Seconds)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="30"
                    value={Math.round(config.timeoutMs / 1000)}
                    onChange={e => setConfig(prev => ({ ...prev, timeoutMs: Math.min(30, Math.max(5, parseInt(e.target.value) || 15)) * 1000 }))}
                    className="w-full px-3 py-2 rounded border border-slate-300 font-mono text-xs"
                  />
                  <p className="text-[10px] text-slate-500 mt-0.5">Vercel function request timeout</p>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleResetToDemo}
                  className="text-xs text-slate-500 hover:text-slate-800 flex items-center space-x-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset to In-Browser Engine</span>
                </button>

                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-300 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded shadow-xs"
                  >
                    Save Configuration
                  </button>
                </div>
              </div>

            </form>
          ) : (
            /* Documented API Contract Tab */
            <div className="space-y-4">
              <div className="p-3 bg-slate-900 text-slate-200 rounded-lg font-mono text-xs overflow-x-auto space-y-2">
                <div className="text-emerald-400 font-bold">
                  POST /extract
                </div>
                <div className="text-slate-400">
                  Content-Type: multipart/form-data
                </div>
                <div className="text-slate-300">
                  Headers: Authorization: Bearer &lt;KEY&gt;
                </div>
                <pre className="text-blue-300 text-[11px] leading-relaxed pt-2">
{`// Request: multipart/form-data
file: <PDF file>

// Actual Open Invoice Engine response:
{
  "page_count": 1,
  "pages": [],
  "combined_text": "Invoice # INV-100 ...",
  "ocr_used": false,
  "ocr_required": false,
  "pages_requiring_ocr": []
}

// InvoiceFlow parses combined_text locally using deterministic rules.
// Optional POST /extract-invoice uses Groq only when GROQ_API_KEY is configured.`}
                </pre>
              </div>

              <div className="text-slate-600 text-xs space-y-2">
                <p>
                  <strong>Health Check Endpoint:</strong> <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">GET /health</code> returning <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">&#123;&quot;status&quot;: &quot;ok&quot;&#125;</code>.
                </p>
                <p>
                  <strong>Zero-AI workflow:</strong> The API extracts PDF text and runs local OCR where available. InvoiceFlow applies deterministic parsing rules; fields must be reviewed. Groq is optional and is not used by the standard /extract workflow.
                </p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
