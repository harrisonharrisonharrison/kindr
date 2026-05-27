import { X, Check } from 'lucide-react';

export default function JobSelectionModal({ isOpen, onClose, event, onSelectJob, currentJobLabel }) {
  if (!isOpen || !event) return null;

  const jobs = event.jobs || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop blur overlay */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-md bg-[#141417] border border-[#27272a] rounded-2xl overflow-hidden shadow-2xl z-10 flex flex-col max-h-[85vh] animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-5 border-b border-[#27272a]/60 bg-[#0c0c0f]/80">
          <div>
            <h3 className="text-lg font-bold text-white leading-tight">Volunteer for {event.name}</h3>
            <p className="text-xs text-gray-400 mt-1">Select a specific job to help the community.</p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#1c1c21] hover:bg-[#27272a] text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Jobs List */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {jobs.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm italic">
              No specific jobs listed for this event.
            </div>
          ) : (
            jobs.map((job, idx) => {
              const isCurrent = job.label === currentJobLabel;
              const isFull = job.filled >= job.needed;
              const percent = Math.min(100, (job.filled / job.needed) * 100) || 0;

              return (
                <div 
                  key={idx} 
                  className={`border rounded-xl p-4 transition-all duration-200 ${
                    isCurrent 
                      ? 'bg-orange-500/5 border-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.1)]' 
                      : 'bg-[#1c1c21] border-[#27272a]/80 hover:border-gray-700'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-bold text-white text-sm flex items-center gap-2">
                        {job.label}
                        {isCurrent && (
                          <span className="text-[10px] bg-orange-500 text-white px-2 py-0.5 rounded-full font-bold flex items-center gap-0.5">
                            <Check size={10} strokeWidth={3} /> Active
                          </span>
                        )}
                        {isFull && !isCurrent && (
                          <span className="text-[10px] bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full font-bold border border-red-500/20">
                            Full
                          </span>
                        )}
                      </h4>
                      <p className="text-xs text-gray-400 mt-1">
                        {job.filled} of {job.needed} spots filled
                      </p>
                    </div>

                    <button
                      onClick={() => onSelectJob(job.label)}
                      disabled={isCurrent || (isFull && !isCurrent)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer active:scale-97 ${
                        isCurrent 
                          ? 'bg-transparent text-orange-500 border-orange-500/20 cursor-default active:scale-100'
                          : isFull 
                            ? 'bg-transparent text-gray-600 border-gray-800 cursor-not-allowed active:scale-100'
                            : 'bg-orange-500 hover:bg-orange-600 text-white border-orange-500 shadow-md shadow-orange-500/10'
                      }`}
                    >
                      {isCurrent ? 'Selected' : isFull ? 'Full' : 'Select'}
                    </button>
                  </div>

                  {/* Progress bar */}
                  <div className="h-1.5 w-full bg-[#141417] rounded-full overflow-hidden border border-[#27272a]/30 mt-3">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${
                        isCurrent ? 'bg-orange-500' : isFull ? 'bg-gray-600' : 'bg-orange-500/80'
                      }`}
                      style={{ width: `${percent}%` }}
                    ></div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#0c0c0f]/80 border-t border-[#27272a]/60 flex justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-[#1c1c21] hover:bg-[#27272a] border border-[#27272a]/80 text-gray-300 hover:text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>

      </div>
    </div>
  );
}
