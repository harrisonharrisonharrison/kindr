import React from 'react';
import { Heart, Calendar, MapPin, Clock } from 'lucide-react';

export default function ImpactView({ liveEvents, liveParticipants, profile }) {
  // Get all events the user is participating in or following
  const participantEventIds = liveParticipants
    .filter(p => p.user_id === profile?.id)
    .map(p => p.event_id);

  const followedEvents = liveEvents.filter(e => participantEventIds.includes(e.id));

  return (
    <div className="flex flex-col h-full bg-[#0b0b0c]">
      <header className="flex justify-between items-center px-8 py-5 border-b border-[#1e1e24]/40 bg-[#0c0c0f]/80 backdrop-blur-md sticky top-0 z-10">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center">
            <Heart className="mr-2 text-rose-500" /> Your Impact
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">Events you are following or volunteering for.</p>
        </div>
      </header>

      <div className="p-8 space-y-8 flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {followedEvents.length > 0 ? (
            followedEvents.map((event) => {
              const myParticipantRecord = liveParticipants.find(p => p.user_id === profile?.id && p.event_id === event.id);
              const isVolunteer = myParticipantRecord?.role === 'volunteer';

              const eventDate = new Date(event.time);
              const isUrgent = (eventDate - new Date()) < 86400000 && (eventDate - new Date()) > 0;

              return (
                <div key={event.id} className="bg-[#141417] border border-[#27272a]/40 p-6 rounded-2xl relative overflow-hidden group hover:border-rose-500/30 transition-all flex flex-col">
                  {isUrgent && <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-orange-500"></div>}
                  
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-white group-hover:text-rose-500 transition-colors">{event.name}</h3>
                      <p className="text-xs text-gray-400 flex items-center mt-1">
                        By {event.organizer?.name || 'Community'}
                      </p>
                    </div>
                    {isVolunteer ? (
                      <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-md text-[10px] font-bold uppercase tracking-wider">
                        Volunteering
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-md text-[10px] font-bold uppercase tracking-wider">
                        Following
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 mb-6 flex-1">
                    <div className="flex items-center text-sm text-gray-300">
                      <Calendar size={16} className="text-gray-500 mr-2 shrink-0" />
                      <span className="truncate">{eventDate.toLocaleDateString()} at {eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="flex items-start text-sm text-gray-300">
                      <MapPin size={16} className="text-gray-500 mr-2 shrink-0 mt-0.5" />
                      <span className="line-clamp-2 leading-tight">{event.location}</span>
                    </div>
                  </div>

                  <p className="text-sm text-gray-400 line-clamp-2 mb-4 flex-1">
                    {event.description}
                  </p>
                </div>
              );
            })
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-center bg-[#141417] border border-[#27272a]/20 rounded-2xl">
              <Heart className="w-12 h-12 text-gray-600 mb-4 opacity-50" />
              <h3 className="text-lg font-semibold text-white mb-2">No followed events yet</h3>
              <p className="text-sm text-gray-400 max-w-sm">
                Head back to the dashboard and click the Follow button on any event to keep track of it here!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
