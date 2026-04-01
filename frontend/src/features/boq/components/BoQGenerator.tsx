/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useMemo, useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  Printer, 
  FileCheck, 
  TrendingUp,
  Receipt,
  Calculator,
  Loader2,
  Database
} from 'lucide-react';
import { useAuth } from "../../../features/auth/AuthContext";
import { db } from "../../../lib/database/database";

interface BoQItem {
  id: string;
  code: string;
  description: string;
  unit: string;
  qty: number;
  rate: number;
}

interface BoQGeneratorProps {
  projectId: string;
  projectName: string;
  // Optional initial items for rapid UI preview
  initialItems?: BoQItem[]; 
}

const BoQGenerator: React.FC<BoQGeneratorProps> = ({ projectId, projectName, initialItems = [] }) => {
  useAuth();
  const [items, setItems] = useState<BoQItem[]>(initialItems);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadBillData = async () => {
      if (!db || !projectId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        // Query Dexie for items belonging to this project
        const storedItems = await db.bill_items
          .where('project_id')
          .equals(projectId)
          .toArray();

        // Map database schema to UI presentation format
        const mappedItems: BoQItem[] = storedItems.map((item: any) => ({
          id: item.id,
          code: item.item_code || 'UNCODED',
          description: item.description,
          unit: item.unit,
          qty: item.quantity,
          rate: item.rate
        }));

        setItems(mappedItems);
      } catch (err) {
        console.error("Valuation Error: Could not reach office database.", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadBillData();
  }, [projectId]);

  // Financial Computation Logic (Standard SMM-KE Calculations)
  const totals = useMemo(() => {
    const net = items.reduce((acc, curr) => acc + (curr.qty * curr.rate), 0);
    const vat = net * 0.16; // Standard Kenya VAT rate
    return { net, vat, total: net + vat };
  }, [items]);

  return (
    <section className="flex-1 flex flex-col space-y-8 p-5 sm:p-6 animate-in fade-in slide-in-from-bottom-4 duration-700 overflow-hidden">
      
      {/* 1. Valuation Summary Header */}
      <header className="flex shrink-0 flex-col items-start justify-between gap-5 lg:flex-row lg:items-end">
        <div className="space-y-2 text-left">
          <h2 className="theme-title text-3xl sm:text-4xl font-black uppercase italic tracking-tighter leading-none">
            Bill of <span className="text-amber-500">Quantities.</span>
          </h2>
          <p className="theme-admin-label">
            SMM-Kenya Standard Compliance • {projectName}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button className="theme-button-muted theme-muted theme-admin-control flex items-center gap-3 transition-all active:scale-95">
            <Printer size={16} /> Print Draft
          </button>
          <button className="theme-admin-control flex items-center gap-3 rounded-[1.1rem] bg-amber-500 text-black shadow-2xl shadow-amber-500/20 hover:bg-amber-400 active:scale-95 transition-all">
            <FileSpreadsheet size={16} /> Export to Excel
          </button>
        </div>
      </header>

      {/* 2. Professional BoQ Ledger Table */}
      <div className="theme-surface-overlay flex flex-1 flex-col overflow-hidden rounded-[2rem] border backdrop-blur-3xl transition-all duration-500">
        
        {isLoading ? (
          <div className="flex flex-1 flex-col items-center justify-center p-16 opacity-30">
            <Loader2 className="w-12 h-12 animate-spin mb-4" />
            <p className="theme-admin-label">Compiling Ledger Data...</p>
          </div>
        ) : (
          <div className="flex-1 overflow-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead className="theme-surface-inset theme-divider sticky top-0 z-10 border-b">
                <tr className="theme-admin-label">
                  <th className="px-6 py-4">Item Code</th>
                  <th className="px-6 py-4">Description of Works</th>
                  <th className="px-4 py-4 text-center">Unit</th>
                  <th className="px-6 py-4 text-right">Quantity</th>
                  <th className="px-6 py-4 text-right">Rate</th>
                  <th className="px-6 py-4 text-right">Amount (KES)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[color:var(--app-divider)]">
                {items.length > 0 ? items.map((item) => (
                  <tr key={item.id} className="group hover:bg-amber-500/5 transition-colors">
                    <td className="px-6 py-5">
                      <span className="theme-admin-meta font-mono text-[0.74rem] uppercase tracking-tight">
                        {item.code}
                      </span>
                    </td>
                    <td className="max-w-xl px-6 py-5">
                      <p className="theme-admin-row-title leading-relaxed group-hover:text-amber-500 transition-colors">
                        {item.description}
                      </p>
                    </td>
                    <td className="px-4 py-5 text-center">
                      <span className="theme-surface-inset theme-admin-chip theme-muted inline-flex border">
                        {item.unit}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <p className="theme-title text-lg font-black tracking-tight leading-none">
                        {item.qty.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </td>
                    <td className="theme-admin-meta px-6 py-5 text-right">
                      {item.rate.toLocaleString()}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <p className="text-xl font-black text-amber-500 tracking-tight leading-none italic">
                        {(item.qty * item.rate).toLocaleString()}
                      </p>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="p-20 text-center opacity-30">
                        <Calculator size={52} className="mx-auto mb-4" />
                        <p className="theme-admin-subheading">No Measured Items Found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 3. Financial Summary Footer */}
        <div className="theme-surface-inset theme-divider flex flex-col items-start gap-8 border-t p-6 sm:p-8 md:flex-row md:items-center md:justify-end md:gap-12 shadow-inner">
          
          <div className="w-full md:w-96 space-y-5">
            <div className="flex justify-between items-center opacity-40">
              <span className="theme-admin-label text-left">Net Construction Cost</span>
              <span className="text-lg font-black italic tracking-tight">KES {totals.net.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center opacity-40">
              <div className="flex items-center gap-2">
                <Receipt size={12} />
                <span className="theme-admin-label text-left">VAT Amount (16%)</span>
              </div>
              <span className="text-lg font-black italic tracking-tight">KES {totals.vat.toLocaleString()}</span>
            </div>
            
            <div className="h-px bg-zinc-800" />
            
            <div className="flex justify-between items-center group cursor-default">
              <div className="text-left">
                <p className="theme-admin-label mb-1 text-amber-500">Total Carried to Summary</p>
                <p className="theme-admin-meta text-left">Professional Valuation Finalized</p>
              </div>
              <div className="text-right">
                <p className="theme-title text-3xl sm:text-4xl font-black italic tracking-tight group-hover:scale-105 transition-transform duration-500">
                  KES {totals.total.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Document Verification Footer */}
      <footer className="flex flex-col gap-4 border-t border-[color:var(--app-divider)] pt-5 opacity-60 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <FileCheck size={16} className="text-emerald-500" />
          <p className="theme-admin-label">
            Certified Valuation System v2.0
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-5">
          <div className="flex items-center gap-2">
            <Database size={12} />
            <span className="theme-admin-meta text-[0.72rem] uppercase">LOCAL_DB: {projectName.slice(0,3).toUpperCase()}-QS-AUTO</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp size={12} className="text-amber-500" />
            <span className="theme-admin-meta text-[0.72rem] uppercase">SMM-KE Compliant Report</span>
          </div>
        </div>
      </footer>
    </section>
  );
};

export default BoQGenerator;
