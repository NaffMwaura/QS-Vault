import { Maximize2 } from "lucide-react";
import BoQGenerator from "../../../boq/components/BoQGenerator";
import CertificateGenerator from "../../../reports/components/CertificateGenerator";
import WhatsAppExport from "../../../reports/components/WhatsAppExport";
import type { Measurement } from "../../types/takeoff";

interface ReportsWorkspaceProps {
  projectId: string;
  projectName: string;
  measurements: Measurement[];
}

const ReportsWorkspace = ({
  projectId,
  projectName,
  measurements,
}: ReportsWorkspaceProps) => {
  return (
    <div className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden custom-scrollbar bg-[#050505] p-4 sm:p-14 space-y-10 sm:space-y-20 animate-in slide-in-from-bottom-6 min-w-0">
      <div className="max-w-7xl mx-auto w-full min-w-0 rounded-[2rem] border border-zinc-800 bg-zinc-950/60 p-5 sm:p-6">
        <p className="text-[10px] font-black uppercase tracking-[0.28em] text-zinc-500 mb-2">
          Reports Workspace
        </p>
        <p className="text-sm sm:text-base font-semibold text-zinc-200 leading-snug">
          Use this area to convert verified takeoff quantities into BOQ output, review work executed, and prepare certificate records.
        </p>
      </div>
      <div className="max-w-7xl mx-auto w-full min-w-0 grid lg:grid-cols-3 gap-8 sm:gap-16">
        <div className="lg:col-span-2 space-y-8 min-w-0">
          <div className="flex items-center gap-4 px-2 sm:px-6 opacity-40 min-w-0">
            <Maximize2 size={16} />
            <h4 className="text-[10px] font-black uppercase tracking-widest">
              Bill Calculation Engine
            </h4>
          </div>
          <BoQGenerator projectId={projectId} projectName={projectName} />
        </div>
        <div className="space-y-8 sm:space-y-12 min-w-0">
          <WhatsAppExport
            projectName={projectName}
            data={{
              certNumber: "IPC/001",
              valuationDate: new Date().toLocaleDateString(),
              contractSum: 0,
              workExecuted: measurements.reduce(
                (acc, item) => acc + Math.abs(item.value) * 1000,
                0,
              ),
              materialsOnSite: 0,
              previousCertified: 0,
              retentionPercent: 10,
            }}
          />
          <CertificateGenerator projectId={projectId} projectName={projectName} />
        </div>
      </div>
      <footer className="pt-16 sm:pt-32 pb-10 text-center opacity-10">
        <p className="text-[10px] font-black uppercase tracking-[1em]">
          End Of Technical Record
        </p>
      </footer>
    </div>
  );
};

export default ReportsWorkspace;
