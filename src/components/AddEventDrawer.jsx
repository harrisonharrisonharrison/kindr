import React, { useState } from 'react';
import Drawer from './Drawer';
import { Plus, X } from 'lucide-react';

export default function AddEventDrawer({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    description: '',
    time: '',
    volunteersNeeded: 0,
    supplies: '',
    jobs: []
  });

  const handleAddJob = () => {
    setFormData(prev => ({
      ...prev,
      jobs: [...prev.jobs, { label: '', needed: 0, filled: 0 }]
    }));
  };

  const handleJobChange = (index, field, value) => {
    const newJobs = [...formData.jobs];
    newJobs[index][field] = value;
    setFormData(prev => ({ ...prev, jobs: newJobs }));
  };

  const handleRemoveJob = (index) => {
    const newJobs = formData.jobs.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, jobs: newJobs }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Submitting event:', formData);
    // Submit logic here
    onClose();
  };

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Create New Event">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 font-semibold">Event Name *</label>
          <input 
            type="text" 
            required
            value={formData.name}
            onChange={e => setFormData({...formData, name: e.target.value})}
            className="w-full px-4 py-2.5 bg-[#1c1c21] border border-[#27272a]/80 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-white placeholder-gray-600 text-sm"
            placeholder="e.g. Community Garden Cleanup"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 font-semibold">Location</label>
          <input 
            type="text" 
            value={formData.location}
            onChange={e => setFormData({...formData, location: e.target.value})}
            className="w-full px-4 py-2.5 bg-[#1c1c21] border border-[#27272a]/80 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-white placeholder-gray-600 text-sm"
            placeholder="e.g. 123 Main St, Garden Grove, CA"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 font-semibold">Time *</label>
          <input 
            type="datetime-local" 
            required
            value={formData.time}
            onChange={e => setFormData({...formData, time: e.target.value})}
            className="w-full px-4 py-2.5 bg-[#1c1c21] border border-[#27272a]/80 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-white text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 font-semibold">Description</label>
          <textarea 
            rows={3}
            value={formData.description}
            onChange={e => setFormData({...formData, description: e.target.value})}
            className="w-full px-4 py-2.5 bg-[#1c1c21] border border-[#27272a]/80 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-white placeholder-gray-600 text-sm resize-none"
            placeholder="Tell volunteers what they'll be doing..."
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 font-semibold">Supplies Needed</label>
          <input 
            type="text" 
            value={formData.supplies}
            onChange={e => setFormData({...formData, supplies: e.target.value})}
            className="w-full px-4 py-2.5 bg-[#1c1c21] border border-[#27272a]/80 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-white placeholder-gray-600 text-sm"
            placeholder="Comma separated (e.g. Gloves, Trash bags)"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 font-semibold">Total Volunteers Needed</label>
          <input 
            type="number" 
            min="0"
            value={formData.volunteersNeeded}
            onChange={e => setFormData({...formData, volunteersNeeded: parseInt(e.target.value) || 0})}
            className="w-full px-4 py-2.5 bg-[#1c1c21] border border-[#27272a]/80 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-white text-sm"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-3">
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider font-semibold">Specific Jobs</label>
            <button 
              type="button" 
              onClick={handleAddJob}
              className="text-xs text-orange-500 hover:text-orange-400 font-bold flex items-center transition-colors cursor-pointer"
            >
              <Plus size={14} className="mr-1" /> Add Job
            </button>
          </div>
          
          <div className="space-y-3">
            {formData.jobs.map((job, index) => (
              <div key={index} className="flex space-x-2 items-start bg-[#1c1c21] p-3.5 rounded-xl border border-[#27272a]/60">
                <div className="flex-1 space-y-3">
                  <input 
                    type="text" 
                    placeholder="Job label (e.g. Box Lifters)"
                    value={job.label}
                    onChange={e => handleJobChange(index, 'label', e.target.value)}
                    className="w-full px-3 py-1.5 text-sm bg-[#141417] border border-[#27272a]/80 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-white placeholder-gray-600"
                  />
                  <div className="flex items-center text-xs space-x-2 text-gray-400 font-semibold">
                    <span>Volunteers Needed:</span>
                    <input 
                      type="number" 
                      min="0"
                      value={job.needed}
                      onChange={e => handleJobChange(index, 'needed', parseInt(e.target.value) || 0)}
                      className="w-20 px-3 py-1 bg-[#141417] border border-[#27272a]/80 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-white text-center"
                    />
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => handleRemoveJob(index)}
                  className="text-gray-500 hover:text-red-400 p-1.5 hover:bg-[#27272a] rounded-lg transition-colors cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            {formData.jobs.length === 0 && (
              <p className="text-xs text-gray-500 italic text-center py-2">No specific jobs added. General volunteers will be requested.</p>
            )}
          </div>
        </div>

        <div className="pt-5 border-t border-[#27272a]/35 flex space-x-3">
          <button 
            type="button" 
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-[#1c1c21] border border-[#27272a]/85 text-gray-300 rounded-xl hover:bg-[#27272a] hover:text-white font-semibold text-sm transition-all cursor-pointer text-center"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="flex-1 px-4 py-2.5 bg-orange-500 text-white rounded-xl hover:bg-orange-600 font-semibold text-sm transition-all shadow-lg shadow-orange-500/10 cursor-pointer text-center"
          >
            Create Event
          </button>
        </div>
      </form>
    </Drawer>
  );
}
