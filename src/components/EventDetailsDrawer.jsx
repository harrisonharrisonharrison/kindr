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
      <div className="space-y-8">
        
        {/* Header Info */}
        <div className="space-y-4">
          <h1 className="text-2xl font-bold text-gray-900">{event.name}</h1>
          
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <User size={16} className="text-gray-400" />
              <span>Organized by <strong className="text-gray-900">{event.organizerName}</strong></span>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar size={16} className="text-gray-400" />
              <span>{event.time}</span>
            </div>
            <div className="flex items-center space-x-2">
              <MapPin size={16} className="text-gray-400" />
              <span>{event.location}</span>
            </div>
          </div>
        </div>

        {/* Action Button - Follow / Unfollow */}
        <div>
          <button 
            className={`w-full py-3 px-4 rounded-md font-medium text-center transition-colors border ${
              amIFollowing || amIVolunteering
                ? 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50' 
                : 'bg-black text-white border-black hover:bg-gray-800'
            }`}
          >
            {amIFollowing || amIVolunteering ? (
              <span className="flex items-center justify-center">
                <CheckCircle2 size={18} className="mr-2 text-green-600" /> Following Event
              </span>
            ) : (
              "+ Follow Event"
            )}
          </button>
        </div>

        {/* Description */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-2">About</h3>
          <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
            {event.description}
          </p>
        </div>

        {/* Supplies */}
        {event.supplies && event.supplies.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-2">Supplies</h3>
            <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
              {event.supplies.map((supply, i) => (
                <li key={i}>{supply}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Jobs */}
        {event.jobs && event.jobs.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Jobs Needed</span>
              <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-medium">
                {event.jobs.reduce((acc, job) => acc + (job.needed - job.filled), 0)} spots left
              </span>
            </h3>
            <div className="space-y-3 mt-3">
              {event.jobs.map((job, i) => {
                const percent = Math.min(100, (job.filled / job.needed) * 100) || 0;
                return (
                  <div key={i} className="bg-gray-50 border border-gray-100 p-3 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-900">{job.label}</span>
                      <span className="text-xs text-gray-500 font-medium">{job.filled} / {job.needed} filled</span>
                    </div>
                    {/* Progress bar */}
                    <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500 rounded-full transition-all duration-500"
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
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">Live Updates</h3>
            <div className="space-y-4">
              {event.updates.map((update, i) => (
                <div key={i} className="border-l-2 border-gray-200 pl-4 py-1">
                  <p className="text-xs text-gray-500 font-medium mb-1">{update.timestamp}</p>
                  <p className="text-sm text-gray-800">{update.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </Drawer>
  );
}
