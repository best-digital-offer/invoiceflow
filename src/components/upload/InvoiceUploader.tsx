import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Sparkles, 
  X, 
  ArrowRight,
  ShieldCheck,
  FileCheck,
  RotateCcw
} from 'lucide-react';
import { BackendConfig, Invoice } from '../../types';
import { InvoiceExtractionService } from '../../services/pdfExtractor';
import { DeterministicValidationEngine } from '../../services/validationEngine';
import { storageService, INITIAL_DEMO_INVOICES } from '../../services/storage';
import { supabaseData } from '../../services/supabaseData';

interface FileUploadTask {
  id: string;
  file: File;
  stage: 'queued' | 'reading_file' | 'extracting_text' | 'parsing_fields' | 'validating' | 'completed' | 'failed';
  progress: number;
  message: string;
  extractedInvoice?: Invoice;
  error?: string;
  isDuplicate?: boolean;
}

interface InvoiceUploaderProps {
  backendConfig: BackendConfig;
  onUploadComplete: (invoices: Invoice[]) => void;
  onNavigateToInvoice: (id: string) => void;
  onOpenApiConfig: () => void;
}

export const InvoiceUploader: React.FC<InvoiceUploaderProps> = ({
  backendConfig,
  onUploadComplete,
  onNavigateToInvoice,
  onOpenApiConfig,
}) => {
  const [tasks, setTasks] = useState<FileUploadTask[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const existingInvoices = storageService.getInvoices();

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newTasks: FileUploadTask[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // This endpoint currently extracts selectable text from PDFs only.
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

      if (!isPdf) {
        newTasks.push({
          id: `task_${Date.now()}_${i}`,
          file,
          stage: 'failed',
          progress: 100,
          message: 'Only PDF files are supported. Image uploads and scanned-PDF OCR are not available yet.',
          error: 'Unsupported file format',
        });
        continue;
      }

      // Keep the client limit aligned with the Vercel function's 4 MB limit.
      if (file.size > 4 * 1024 * 1024) {
        newTasks.push({
          id: `task_${Date.now()}_${i}`,
          file,
          stage: 'failed',
          progress: 100,
          message: 'PDF exceeds the current 4 MB limit for Vercel extraction. Compress the PDF or split it into smaller files.',
          error: 'File size exceeded',
        });
        continue;
      }

      newTasks.push({
        id: `task_${Date.now()}_${i}`,
        file,
        stage: 'queued',
        progress: 0,
        message: 'Queued for deterministic extraction...',
      });
    }

    setTasks(prev => [...prev, ...newTasks]);
    processQueue(newTasks);
  };

  const processQueue = async (taskList: FileUploadTask[]) => {
    setIsProcessing(true);
    const completedInvoices: Invoice[] = [];

    for (const task of taskList) {
      if (task.stage === 'failed') continue;

      // Update task to reading
      updateTask(task.id, { stage: 'reading_file', progress: 10, message: `Processing ${task.file.name}...` });

      try {
        // Read file data URL for PDF previewer
        let fileDataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => resolve('');
          reader.readAsDataURL(task.file);
        });

        // Run extraction engine
        const extraction = await InvoiceExtractionService.processFile(
          task.file,
          backendConfig,
          (stage, percent, msg) => {
            updateTask(task.id, { stage, progress: percent, message: msg });
          }
        );

        const ownerId = storageService.getCurrentUser()?.id || '';
        const invoiceId = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const extractionWarnings = [...extraction.warnings];
        let documentPath: string | undefined;
        try {
          documentPath = await supabaseData.uploadInvoicePdf(ownerId, invoiceId, task.file);
        } catch (storageError) {
          const reason = storageError instanceof Error ? storageError.message : 'Unknown storage error';
          extractionWarnings.push(`PDF preview could not be saved to secure cloud storage: ${reason}`);
        }
        if (documentPath) {
          try {
            // Keep a small signed URL in the local cache instead of a large base64 PDF.
            fileDataUrl = await supabaseData.getSignedPdfUrl(documentPath);
          } catch {
            extractionWarnings.push('The PDF was uploaded, but its preview link could not be created yet.');
          }
        }

        const newInvoice: Invoice = {
          id: invoiceId,
          ownerId,
          documentPath,
          originalFilename: task.file.name,
          fileSize: task.file.size,
          fileType: task.file.type || 'application/pdf',
          fileDataUrl,
          supplierName: extraction.invoice.supplierName || '',
          supplierAddress: extraction.invoice.supplierAddress || '',
          supplierTaxId: extraction.invoice.supplierTaxId || '',
          invoiceNumber: extraction.invoice.invoiceNumber || '',
          invoiceDate: extraction.invoice.invoiceDate || '',
          dueDate: extraction.invoice.dueDate || '',
          purchaseOrderNumber: extraction.invoice.purchaseOrderNumber || '',
          customerName: extraction.invoice.customerName || '',
          paymentTerms: extraction.invoice.paymentTerms || '',
          currency: extraction.invoice.currency || 'USD',
          subtotal: extraction.invoice.subtotal || 0,
          discount: extraction.invoice.discount || 0,
          taxAmount: extraction.invoice.taxAmount || 0,
          shippingAmount: extraction.invoice.shippingAmount || 0,
          totalAmount: extraction.invoice.totalAmount || 0,
          lineItems: extraction.invoice.lineItems || [],
          extractionMethod: extraction.extractionMethod,
          extractionStatus: 'completed',
          reviewStatus: 'awaiting_review',
          notes: extractionWarnings.length > 0 ? extractionWarnings.join(' | ') : undefined,
          validationResult: DeterministicValidationEngine.validate({
            ...extraction.invoice,
            supplierName: extraction.invoice.supplierName || '',
            invoiceNumber: extraction.invoice.invoiceNumber || '',
            invoiceDate: extraction.invoice.invoiceDate || '',
            currency: extraction.invoice.currency || 'USD',
            subtotal: extraction.invoice.subtotal || 0,
            discount: extraction.invoice.discount || 0,
            taxAmount: extraction.invoice.taxAmount || 0,
            shippingAmount: extraction.invoice.shippingAmount || 0,
            totalAmount: extraction.invoice.totalAmount || 0,
            lineItems: extraction.invoice.lineItems || [],
          }, {
            roundingTolerance: backendConfig.roundingTolerance,
            existingInvoices,
          }),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // Save into isolated database
        const saved = storageService.saveInvoice(newInvoice);
        storageService.recordUsage({
          operation: 'pdf_extraction',
          status: extractionWarnings.length > 0 ? 'warning' : 'success',
          itemCount: 1,
          details: `Extracted ${task.file.name}; ${extractionWarnings.length} review/storage warning(s).`,
        });
        completedInvoices.push(saved);

        updateTask(task.id, {
          stage: 'completed',
          progress: 100,
          message: 'Text extraction completed. Review the fields and validation results before using this invoice.',
          extractedInvoice: saved,
        });

      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown extraction failure';
        updateTask(task.id, {
          stage: 'failed',
          progress: 100,
          message: `Failed: ${errorMsg}`,
          error: errorMsg,
        });
      }
    }

    setIsProcessing(false);
    if (completedInvoices.length > 0) {
      onUploadComplete(completedInvoices);
    }
  };

  const updateTask = (id: string, updates: Partial<FileUploadTask>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  // Quick Action: Load Sample Realistic Invoices
  const handleLoadSampleBatch = () => {
    const user = storageService.getCurrentUser();
    if (!user) return;
    const sampleBatch: Invoice[] = INITIAL_DEMO_INVOICES.map((inv, idx) => ({
      ...inv,
      id: `inv_sample_${Date.now()}_${idx}`,
      ownerId: user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    storageService.saveBatchInvoices(sampleBatch);
    onUploadComplete(sampleBatch);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-6 px-4">
      
      {/* Title & Engine Mode Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Upload & Extract Invoices
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Process single or batch PDF invoices. Deterministic field extraction and formula verification.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleLoadSampleBatch}
            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-md text-xs font-semibold transition-colors flex items-center space-x-1.5 shadow-2xs"
            title="Import 5 standard sample invoices with varied currencies and discrepancy tests"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Load Sample Invoice Batch</span>
          </button>

          <button
            onClick={onOpenApiConfig}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-medium transition-colors"
          >
            Engine Settings
          </button>
        </div>
      </div>

      {/* Backend Mode Transparency Banner (Requirement #6 & #15) */}
      <div className={`p-3.5 rounded-lg border text-xs flex items-center justify-between ${
        backendConfig.useLiveBackend 
          ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
          : 'bg-amber-50 border-amber-200 text-amber-900'
      }`}>
        <div className="flex items-center space-x-2.5">
          <span className={`w-2.5 h-2.5 rounded-full ${backendConfig.useLiveBackend ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
          <div>
            <span className="font-bold">
              {backendConfig.useLiveBackend ? 'Vercel API Extraction Active' : 'In-Browser Deterministic Engine Mode'}
            </span>
            <p className="text-[11px] opacity-80 mt-0.5">
              {backendConfig.useLiveBackend
                ? `Invoice text will be sent to the configured Vercel extraction endpoint at ${backendConfig.baseUrl}`
                : 'PDF text is parsed in your browser; signed-in invoice records and source PDFs are also stored in your private Supabase account.'}
            </p>
          </div>
        </div>

        <button
          onClick={onOpenApiConfig}
          className="text-xs font-semibold underline hover:opacity-80 shrink-0 ml-3"
        >
          {backendConfig.useLiveBackend ? 'API Settings' : 'API Settings'}
        </button>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
          isDragOver
            ? 'border-blue-500 bg-blue-50/50 scale-[1.005]'
            : 'border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50/60'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        <div className="w-12 h-12 mx-auto rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
          <UploadCloud className="w-6 h-6" />
        </div>

        <h3 className="text-sm font-bold text-slate-800">
          Drop your PDF invoices here, or <span className="text-blue-600 underline">browse files</span>
        </h3>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          Upload text-based PDF invoices up to 4 MB each. Scanned PDFs requiring OCR are not supported yet.
        </p>

        <div className="mt-4 flex flex-wrap justify-center items-center gap-4 text-[11px] text-slate-400">
          <span className="flex items-center">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 mr-1" />
            Deterministic validation
          </span>
          <span className="flex items-center">
            <FileCheck className="w-3.5 h-3.5 text-blue-500 mr-1" />
            Duplicate detection
          </span>
          <span>Zero third-party AI required</span>
        </div>
      </div>

      {/* Batch Processing Tasks Table */}
      {tasks.length > 0 && (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Batch Processing Queue ({tasks.filter(t => t.stage === 'completed').length} / {tasks.length} Completed)
            </h3>
            {tasks.some(t => t.stage === 'completed') && (
              <button
                onClick={() => setTasks([])}
                className="text-xs text-slate-500 hover:text-slate-800 transition-colors"
              >
                Clear Queue
              </button>
            )}
          </div>

          <div className="divide-y divide-slate-100">
            {tasks.map(task => (
              <div key={task.id} className="p-4 flex items-center justify-between text-xs hover:bg-slate-50/70 transition-colors">
                
                <div className="flex items-center space-x-3 max-w-[60%]">
                  <div className={`w-8 h-8 rounded flex items-center justify-center shrink-0 ${
                    task.stage === 'completed'
                      ? 'bg-emerald-100 text-emerald-700'
                      : task.stage === 'failed'
                      ? 'bg-rose-100 text-rose-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {task.stage === 'completed' ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : task.stage === 'failed' ? (
                      <AlertCircle className="w-4 h-4" />
                    ) : (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    )}
                  </div>

                  <div className="truncate">
                    <p className="font-semibold text-slate-800 truncate" title={task.file.name}>
                      {task.file.name}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {task.message}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  {task.stage === 'completed' && task.extractedInvoice && (
                    <button
                      onClick={() => onNavigateToInvoice(task.extractedInvoice!.id)}
                      className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold flex items-center space-x-1 shadow-2xs transition-colors"
                    >
                      <span>Review Extraction</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {task.stage !== 'completed' && task.stage !== 'failed' && (
                    <div className="w-24 bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-blue-600 h-full transition-all duration-300"
                        style={{ width: `${task.progress}%` }}
                      />
                    </div>
                  )}

                  {task.stage === 'failed' && (
                    <span className="text-rose-600 font-semibold text-[11px]">
                      {task.error || 'Failed'}
                    </span>
                  )}
                </div>

              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
