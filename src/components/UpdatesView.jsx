import React, { useState, useEffect } from 'react';
import { Bell, Calendar, MapPin, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export default function UpdatesView({ liveEvents, liveParticipants, profile }) {
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUpdates = async () => {
      if (!profile) return;
      
      // Get event IDs we follow or volunteer for
      const participantEventIds = liveParticipants
        .filter(p => p.user_id === profile.id)
        .map(p => p.event_id);

      if (participantEventIds.length === 0) {
        setUpdates([]);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('event_updates')
          .select('*, event:events(name)')
          .in('event_id', participantEventIds)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setUpdates(data || []);
      } catch (err) {
        console.error('Error fetching event updates:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUpdates();
  }, [liveParticipants, profile?.id]);

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + ' years ago';
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + ' months ago';
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + ' days ago';
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + ' hours ago';
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + ' minutes ago';
    return 'Just now';
  };

  return (
    <div className="flex flex-col h-full bg-[#0b0b0c]">
      <header className="flex justify-between items-center px-8 py-5 border-b border-[#1e1e24]/40 bg-[#0c0c0f]/80 backdrop-blur-md sticky top-0 z-10">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center">
            <Bell className="mr-2 text-amber-500" /> Announcements
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">Live updates from events you follow.</p>
        </div>
      </header>

      <div className="p-8 space-y-8 flex-1 overflow-y-auto max-w-4xl mx-auto w-full">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
          </div>
        ) : updates.length > 0 ? (
          <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-[#27272a] before:to-transparent">
            {updates.map((update, index) => (
              <div key={update.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                {/* Icon */}
                <div className="flex items-center justify-center w-10 h-10 rounded-full border border-[#27272a] bg-[#141417] group-hover:border-amber-500/50 text-amber-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 transition-colors z-10">
                  <Bell size={16} />
                </div>
                
                {/* Card */}
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-[#27272a]/40 bg-[#141417] hover:bg-[#1a1a22] transition-colors shadow-sm">
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-bold text-white">{update.event?.name || 'Unknown Event'}</div>
                    <time className="text-xs font-medium text-amber-500">{getTimeAgo(update.created_at)}</time>
                  </div>
                  <div className="text-gray-300 text-sm mt-2 leading-relaxed">
                    {update.text}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-[#141417] border border-[#27272a]/20 rounded-2xl">
            <Bell className="w-12 h-12 text-gray-600 mb-4 opacity-50" />
            <h3 className="text-lg font-semibold text-white mb-2">No announcements yet</h3>
            <p className="text-sm text-gray-400 max-w-sm">
              When organizers post updates to events you follow or volunteer for, they will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
