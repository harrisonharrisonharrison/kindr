import React from 'react';
import Drawer from './Drawer';
import { Calendar, MapPin, User, CheckCircle2 } from 'lucide-react';
import { currentUser } from '../data';

export default function EventDetailsDrawer({ isOpen, onClose, event }) {
  if (!event) return null;

  const amIFollowing = event.followers?.includes(currentUser.id) || false;
  const amIVolunteering = event.volunteers?.includes(currentUser.id) || false;

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Event Details">
      <div className="space-y-8 text-[#f3f4f6]">
        
        {/* Header Info */}
        <div className="space-y-4">
          <h1 className="text-2xl font-bold text-white tracking-tight">{event.name}</h1>
          
          <div className="space-y-2 text-sm text-gray-400 font-medium">
            <div className="flex items-center space-x-2">
              <User size={16} className="text-gray-500" />
              <span>Organized by <strong className="text-white">{event.organizerName}</strong></span>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar size={16} className="text-gray-500" />
              <span>{event.time}</span>
            </div>
            <div className="flex items-center space-x-2">
              <MapPin size={16} className="text-gray-500" />
              <span>{event.location}</span>
            </div>
          </div>
        </div>

        {/* Action Button - Follow / Unfollow */}
        <div>
          <button 
            className={`w-full py-3 px-4 rounded-xl font-bold text-sm text-center transition-all border cursor-pointer active:scale-98 ${
              amIFollowing || amIVolunteering
                ? 'bg-[#1c1c21] text-gray-300 border-[#27272a]/80 hover:bg-[#27272a] hover:text-white' 
                : 'bg-orange-500 text-white border-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-500/10'
            }`}
          >
            {amIFollowing || amIVolunteering ? (
              <span className="flex items-center justify-center">
                <CheckCircle2 size={18} className="mr-2 text-orange-500 animate-pulse" /> Following Event
              </span>
            ) : (
              "+ Follow Event"
            )}
          </button>
        </div>

        {/* Description */}
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">About</h3>
          <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
            {event.description}
          </p>
        </div>

        {/* Supplies */}
        {event.supplies && event.supplies.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Supplies</h3>
            <ul className="list-disc list-inside text-sm text-gray-300 space-y-1.5 pl-1">
              {event.supplies.map((supply, i) => (
                <li key={i}>{supply}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Jobs */}
        {event.jobs && event.jobs.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 flex items-center justify-between">
              <span>Jobs Needed</span>
              <span className="text-[10px] bg-orange-500/10 text-orange-500 px-2 py-0.5 rounded-full font-bold border border-orange-500/20">
                {event.jobs.reduce((acc, job) => acc + (job.needed - job.filled), 0)} spots left
              </span>
            </h3>
            <div className="space-y-3 mt-3">
              {event.jobs.map((job, i) => {
                const percent = Math.min(100, (job.filled / job.needed) * 100) || 0;
                return (
                  <div key={i} className="bg-[#1c1c21] border border-[#27272a]/60 p-4 rounded-xl">
                    <div className="flex justify-between items-center mb-2 text-sm font-semibold">
                      <span className="text-white">{job.label}</span>
                      <span className="text-gray-400">{job.filled} / {job.needed} filled</span>
                    </div>
                    {/* Progress bar */}
                    <div className="h-2 w-full bg-[#141417] rounded-full overflow-hidden border border-[#27272a]/40">
                      <div 
                        className="h-full bg-orange-500 rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {/* Updates Feed */}
        {event.updates && event.updates.length > 0 && (
          <div className="pt-2">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Live Updates</h3>
            <div className="space-y-4">
              {event.updates.map((update, i) => (
                <div key={i} className="border-l-2 border-orange-500/40 pl-4 py-1">
                  <p className="text-[10px] text-orange-500 font-bold mb-1 uppercase tracking-wider">{update.timestamp}</p>
                  <p className="text-sm text-gray-300 leading-normal">{update.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </Drawer>
  );
}
