import { useState } from 'react';
import Drawer from './Drawer';
import { Plus, X, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export default function AddEventDrawer({ isOpen, onClose, onEventAdded }) {
  // Tabs: 'manual' or 'ai'
  const [creationMode, setCreationMode] = useState('ai');
  
  // AI Parser specific states
  const [aiRawText, setAiRawText] = useState('');
  const [aiIsLoading, setAiIsLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [aiQuestions, setAiQuestions] = useState([]);
  const [aiAnswers, setAiAnswers] = useState({});

  // Standard Form State
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Submitting event to Supabase:', formData);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      const eventPayload = {
        name: formData.name,
        location: formData.location,
        description: formData.description,
        time: new Date(formData.time).toISOString(),
        volunteers_needed: formData.volunteersNeeded,
        supplies: formData.supplies
          ? formData.supplies.split(',').map(s => s.trim()).filter(Boolean)
          : [],
        jobs: formData.jobs.map(j => ({
          label: j.label,
          needed: j.needed,
          filled: j.filled || 0
        })),
        organizer_id: userId || '00000000-0000-0000-0000-000000000000'
      };

      const { data, error } = await supabase
        .from('events')
        .insert([eventPayload])
        .select();

      if (error) {
        throw error;
      }

      console.log('Successfully created event in database:', data);

      // Reset AI input and form states on successful save so it is blank next time it opens
      setAiRawText('');
      setAiQuestions([]);
      setAiAnswers({});
      setFormData({
        name: '',
        location: '',
        description: '',
        time: '',
        volunteersNeeded: 0,
        supplies: '',
        jobs: []
      });
      setCreationMode('ai'); // Switch back to default AI mode

      if (onEventAdded) {
        onEventAdded();
      }
      onClose();
    } catch (err) {
      console.error('Error creating event:', err);
      alert('Failed to create event: ' + err.message);
    }
  };

  // Helper to get formatted default time for datetime-local
  const getDefaultTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Run Gemini API call
  const executeAIParse = async (textToParse) => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      setAiError('Missing Gemini API Key in your .env file. Please add VITE_GEMINI_API_KEY to use the AI Smart Fill feature.');
      return;
    }

    setAiIsLoading(true);
    setAiError(null);

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `Analyze the following community or emergency event dump:\n\n"${textToParse}"`
                  }
                ]
              }
            ],
            systemInstruction: {
              parts: [
                {
                  text: "You are an expert emergency coordinator and mutual aid parser. Extract event details from the raw community text dump and structure it into a clean JSON object matching the provided schema. If important details like date, time, location, or target volunteers are missing, list specific clarifying questions in the 'questions' field. Keep descriptions concise, factual, and informative. If jobs are mentioned, parse them as an array of objects containing a 'label' and a 'needed' count. The 'time' field MUST be formatted exactly as YYYY-MM-DDTHH:MM (e.g. 2026-05-27T09:00). If time is relative (like 'today') or missing, choose a reasonable default and make sure to ask a question in 'questions' to verify it."
                }
              ]
            },
            generationConfig: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: 'OBJECT',
                properties: {
                  name: { type: 'STRING', description: 'Name/title of the event' },
                  location: { type: 'STRING', description: 'Address or venue description' },
                  time: { type: 'STRING', description: 'Date and time info formatted strictly as YYYY-MM-DDTHH:MM (e.g. 2026-05-27T09:00)' },
                  description: { type: 'STRING', description: 'Description of what volunteers will do' },
                  volunteersNeeded: { type: 'INTEGER', description: 'Total volunteers needed' },
                  supplies: { type: 'STRING', description: 'Comma separated list of supplies needed' },
                  jobs: {
                    type: 'ARRAY',
                    description: 'Specific volunteer tasks mentioned',
                    items: {
                      type: 'OBJECT',
                      properties: {
                        label: { type: 'STRING', description: 'Job title e.g. Drivers' },
                        needed: { type: 'INTEGER', description: 'Number of volunteers needed for this job' }
                      },
                      required: ['label', 'needed']
                    }
                  },
                  questions: {
                    type: 'ARRAY',
                    description: 'Short clarifying questions if crucial details are missing or need verification',
                    items: { type: 'STRING' }
                  }
                },
                required: ['name', 'location', 'time', 'description', 'volunteersNeeded', 'supplies', 'jobs', 'questions']
              }
            }
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API returned error code ${response.status}`);
      }

      const data = await response.json();
      const rawJson = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawJson) {
        throw new Error('Failed to retrieve text content from Gemini response');
      }

      const parsed = JSON.parse(rawJson);
      console.log('Gemini Parsed Output:', parsed);

      // Validate time format: YYYY-MM-DDTHH:MM
      const timeRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
      const validatedTime = timeRegex.test(parsed.time) ? parsed.time : getDefaultTime();

      // Populate form state
      setFormData({
        name: parsed.name || '',
        location: parsed.location || '',
        description: parsed.description || '',
        time: validatedTime,
        volunteersNeeded: parsed.volunteersNeeded || 0,
        supplies: parsed.supplies || '',
        jobs: (parsed.jobs || []).map(j => ({ ...j, filled: 0 }))
      });

      // Clear the AI prompt input text so it disappears once details are successfully generated
      setAiRawText('');

      // Handle clarifying questions
      if (parsed.questions && parsed.questions.length > 0) {
        setAiQuestions(parsed.questions);
      } else {
        setAiQuestions([]);
        // Switch to manual tab on success with no questions
        setCreationMode('manual');
      }

    } catch (err) {
      console.error('AI Parse Error:', err);
      setAiError(err.message || 'An error occurred while parsing text. Please try again.');
    } finally {
      setAiIsLoading(false);
    }
  };

  const handleAIParseSubmit = (e) => {
    e.preventDefault();
    if (!aiRawText.trim()) return;
    executeAIParse(aiRawText);
  };

  const handleAIRefine = () => {
    // Combine raw text with user answers
    const answersText = Object.entries(aiAnswers)
      .map(([index, val]) => {
        const question = aiQuestions[index];
        return `- Question: "${question}" -> Answer: "${val}"`;
      })
      .join('\n');

    const refinedText = `${aiRawText}\n\nRefined Clarifying Answers:\n${answersText}`;
    
    // Clear answers and questions state for new parse cycle
    setAiAnswers({});
    setAiQuestions([]);
    
    executeAIParse(refinedText);
  };

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Create New Event">
      
      {/* Tab Selector */}
      <div className="flex border-b border-[#27272a]/35 mb-6">
        <button
          type="button"
          onClick={() => setCreationMode('ai')}
          className={`flex-1 pb-3 text-sm font-bold text-center border-b-2 transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
            creationMode === 'ai'
              ? 'border-orange-500 text-orange-500'
              : 'border-transparent text-gray-500 hover:text-gray-300'
          }`}
        >
          <Sparkles size={14} />
          <span>AI Smart Fill</span>
        </button>
        <button
          type="button"
          onClick={() => setCreationMode('manual')}
          className={`flex-1 pb-3 text-sm font-bold text-center border-b-2 transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
            creationMode === 'manual'
              ? 'border-orange-500 text-orange-500'
              : 'border-transparent text-gray-500 hover:text-gray-300'
          }`}
        >
          <span>Manual Form</span>
        </button>
      </div>

      {creationMode === 'ai' ? (
        /* AI Smart Fill Interface */
        <div className="space-y-6">
          <form onSubmit={handleAIParseSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 font-semibold">
                Dump Event Info / Emergency Details
              </label>
              <textarea 
                rows={6}
                required
                value={aiRawText}
                onChange={e => setAiRawText(e.target.value)}
                className="w-full px-4 py-3 bg-[#1c1c21] border border-[#27272a]/80 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-white placeholder-gray-600 text-sm resize-none"
                placeholder="Paste an emergency bulletin, message, or notes here. E.g.:&#10;'We need sandbag loaders at Garden Grove High School. Need 10 people to help. Organizer isGG High, tomorrow 10am. Need to bring water.'"
              />
            </div>

            {aiError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl p-3.5 flex items-start space-x-2">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{aiError}</span>
              </div>
            )}

            <button 
              type="submit" 
              disabled={aiIsLoading || !aiRawText.trim()}
              className="w-full py-2.5 bg-orange-500 text-white rounded-xl hover:bg-orange-600 font-semibold text-sm transition-all shadow-lg shadow-orange-500/10 cursor-pointer text-center flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {aiIsLoading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Parsing details...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Generate Event Details</span>
                </>
              )}
            </button>
          </form>

          {/* Clarifying Questions List */}
          {aiQuestions.length > 0 && !aiIsLoading && (
            <div className="bg-[#1c1c21] border border-[#27272a]/60 p-5 rounded-2xl space-y-4">
              <div className="flex items-center space-x-1.5 text-orange-500">
                <Sparkles size={16} className="animate-pulse" />
                <h4 className="text-xs font-bold uppercase tracking-widest">Refine Event Details</h4>
              </div>
              <p className="text-xs text-gray-400">The AI needs a few more details to structure the event perfectly:</p>
              
              <div className="space-y-4 pt-1">
                {aiQuestions.map((q, index) => (
                  <div key={index} className="space-y-1.5">
                    <label className="block text-xs font-semibold text-gray-300">{q}</label>
                    <input 
                      type="text"
                      value={aiAnswers[index] || ''}
                      onChange={e => setAiAnswers({...aiAnswers, [index]: e.target.value})}
                      className="w-full px-3 py-2 bg-[#141417] border border-[#27272a]/80 rounded-xl focus:ring-1 focus:ring-orange-500 outline-none text-white text-xs placeholder-gray-700"
                      placeholder="Type answer here..."
                    />
                  </div>
                ))}
              </div>

              <div className="pt-2 flex space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    // Skip clarify and just go to manual
                    setAiQuestions([]);
                    setCreationMode('manual');
                  }}
                  className="flex-1 py-2 bg-[#141417] border border-[#27272a]/80 hover:bg-[#27272a] text-gray-400 hover:text-white text-xs font-semibold rounded-xl transition-all cursor-pointer text-center"
                >
                  Skip & Edit Form
                </button>
                <button
                  type="button"
                  onClick={handleAIRefine}
                  className="flex-1 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold rounded-xl transition-all shadow-sm cursor-pointer text-center"
                >
                  Refine Event
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Standard Manual Form (Now pre-populated if filled by AI) */
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
                    className="text-gray-400 hover:text-red-500 mt-1"
                  >
                    <X size={16} />
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
      )}
    </Drawer>
  );
}
