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
          <label className="block text-sm font-medium text-gray-700 mb-1">Event Name *</label>
          <input 
            type="text" 
            required
            value={formData.name}
            onChange={e => setFormData({...formData, name: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-black focus:border-black outline-none"
            placeholder="e.g. Community Garden Cleanup"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
          <input 
            type="text" 
            value={formData.location}
            onChange={e => setFormData({...formData, location: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-black focus:border-black outline-none"
            placeholder="e.g. 123 Main St"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Time *</label>
          <input 
            type="datetime-local" 
            required
            value={formData.time}
            onChange={e => setFormData({...formData, time: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-black focus:border-black outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea 
            rows={3}
            value={formData.description}
            onChange={e => setFormData({...formData, description: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-black focus:border-black outline-none resize-none"
            placeholder="Tell volunteers what they'll be doing..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Supplies Needed</label>
          <input 
            type="text" 
            value={formData.supplies}
            onChange={e => setFormData({...formData, supplies: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-black focus:border-black outline-none"
            placeholder="Comma separated (e.g. Gloves, Trash bags)"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Total Volunteers Needed</label>
          <input 
            type="number" 
            min="0"
            value={formData.volunteersNeeded}
            onChange={e => setFormData({...formData, volunteersNeeded: parseInt(e.target.value) || 0})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-black focus:border-black outline-none"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">Specific Jobs</label>
            <button 
              type="button" 
              onClick={handleAddJob}
              className="text-sm text-green-600 hover:text-green-700 font-medium flex items-center"
            >
              <Plus size={16} className="mr-1" /> Add Job
            </button>
          </div>
          
          <div className="space-y-3">
            {formData.jobs.map((job, index) => (
              <div key={index} className="flex space-x-2 items-start bg-gray-50 p-3 rounded-md border border-gray-200">
                <div className="flex-1 space-y-2">
                  <input 
                    type="text" 
                    placeholder="Job label (e.g. Box Lifters)"
                    value={job.label}
                    onChange={e => handleJobChange(index, 'label', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-black focus:border-black outline-none"
                  />
                  <div className="flex items-center text-sm space-x-2 text-gray-600">
                    <span>Needed:</span>
                    <input 
                      type="number" 
                      min="0"
                      value={job.needed}
                      onChange={e => handleJobChange(index, 'needed', parseInt(e.target.value) || 0)}
                      className="w-16 px-2 py-1 border border-gray-300 rounded focus:ring-black focus:border-black outline-none"
                    />
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => handleRemoveJob(index)}
                  className="text-gray-400 hover:text-red-500 mt-1"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
            {formData.jobs.length === 0 && (
              <p className="text-sm text-gray-500 italic">No specific jobs added. General volunteers will be requested.</p>
            )}
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200 flex space-x-3">
          <button 
            type="button" 
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="flex-1 px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 font-medium transition-colors"
          >
            Create Event
          </button>
        </div>
      </form>
    </Drawer>
  );
}
