import { useState, useEffect } from 'react';
import Drawer from './Drawer';
import { Calendar, MapPin, User, CheckCircle2, Heart, Users, UserPlus, Loader2, X } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { currentUser } from '../data';

export default function EventDetailsDrawer({ isOpen, onClose, event, onUpdate, friends = [], onOpenJobSelection, onLeaveEvent }) {
  const { profile } = useAuth();
  const [updates, setUpdates] = useState([]);
  const [newUpdateText, setNewUpdateText] = useState('');
  const [postIsLoading, setPostIsLoading] = useState(false);
  const [sentInvites, setSentInvites] = useState([]);
  const [inviteIsLoading, setInviteIsLoading] = useState(null);
  
  const userId = profile?.id || currentUser.id;

  // Reusable function to load updates
  const fetchEventUpdates = async () => {
    if (!event) return;
    try {
      const { data, error } = await supabase
        .from('event_updates')
        .select('*')
        .eq('event_id', event.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching updates:', error.message);
      } else {
        setUpdates(
          (data || []).map(u => ({
            timestamp: new Date(u.created_at).toLocaleDateString() + ' ' + new Date(u.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            text: u.text
          }))
        );
      }
    } catch (err) {
      console.error('Unexpected error fetching updates:', err);
    }
  };

  const fetchSentInvites = async () => {
    if (!event || !userId) return;
    try {
      const { data, error } = await supabase
        .from('event_invites')
        .select('invitee_id')
        .eq('event_id', event.id)
        .eq('inviter_id', userId);
      
      if (!error && data) {
        setSentInvites(data.map(d => d.invitee_id));
      }
    } catch (err) {
      console.error('Error fetching sent invites:', err);
    }
  };

  // Load live updates and invites on mount / change
  useEffect(() => {
    if (isOpen && event) {
      fetchEventUpdates();
      fetchSentInvites();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, event]);

  if (!event) return null;

  const amIFollowing = event.followers?.includes(userId) || false;
  const amIVolunteering = event.volunteers?.includes(userId) || false;
  const isOrganizer = event.organizer_id === userId;

  const handleFollowToggle = async () => {
    if (!userId || !event) return;

    try {
      if (amIFollowing) {
        // Unfollow: delete row from event_participants
        const { error } = await supabase
          .from('event_participants')
          .delete()
          .eq('event_id', event.id)
          .eq('user_id', userId)
          .eq('role', 'follower');

        if (error) throw error;
      } else {
        // Follow: insert row in event_participants
        const { error } = await supabase
          .from('event_participants')
          .insert([
            {
              event_id: event.id,
              user_id: userId,
              role: 'follower'
            }
          ]);

        if (error) throw error;
      }

      // Notify dashboard to refresh
      if (onUpdate) {
        onUpdate();
      }
    } catch (err) {
      console.error('Error toggling follow state:', err.message);
    }
  };

  const handleJoinToggle = async () => {
    if (!userId || !event) return;

    try {
      if (amIVolunteering) {
        if (onLeaveEvent) {
          await onLeaveEvent();
        }
      } else {
        if (event.jobs && event.jobs.length > 0) {
          if (onOpenJobSelection) {
            onOpenJobSelection();
          }
        } else {
          await supabase
            .from('event_participants')
            .delete()
            .eq('event_id', event.id)
            .eq('user_id', userId);
            
          const { error } = await supabase
            .from('event_participants')
            .insert([{ event_id: event.id, user_id: userId, role: 'volunteer' }]);
          if (error) throw error;
          
          if (onUpdate) onUpdate();
        }
      }
    } catch (err) {
      console.error('Error toggling join state:', err.message);
    }
  };

  const handlePostUpdate = async (e) => {
    e.preventDefault();
    if (!newUpdateText.trim() || !event) return;

    setPostIsLoading(true);
    try {
      const { error } = await supabase
        .from('event_updates')
        .insert([
          {
            event_id: event.id,
            text: newUpdateText.trim()
          }
        ]);

      if (error) throw error;

      setNewUpdateText('');
      await fetchEventUpdates();
    } catch (err) {
      console.error('Error posting update:', err.message);
      alert('Failed to post live update: ' + err.message);
    } finally {
      setPostIsLoading(false);
    }
  };

  const handleInviteFriend = async (friendId) => {
    if (!event || !userId) return;
    setInviteIsLoading(friendId);
    try {
      const { error } = await supabase
        .from('event_invites')
        .insert([{ event_id: event.id, inviter_id: userId, invitee_id: friendId }]);
      if (!error) {
        setSentInvites([...sentInvites, friendId]);
      } else {
        console.error('Insert error:', error.message);
      }
    } catch (err) {
      console.error('Error sending invite:', err.message);
    } finally {
      setInviteIsLoading(null);
    }
  };

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Event Details">
      <div className="space-y-8 text-[#f3f4f6]">
        
        {/* Header Info */}
        <div className="space-y-4">
          <h1 className="text-2xl font-bold text-white tracking-tight">{event.name}</h1>
          
          <div className="space-y-2 text-sm text-gray-400 font-medium">
            <div className="flex items-center space-x-2">
              <User size={16} className="text-gray-500" />
              <span>Organized by <strong className="text-white">{event.organizerName || event.organizer?.name || 'Community Member'}</strong></span>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar size={16} className="text-gray-500" />
              <span>{new Date(event.time).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
            </div>
            <div className="flex items-center space-x-2">
              <MapPin size={16} className="text-gray-500" />
              <span>{event.location}</span>
            </div>
          </div>
        </div>

        {/* Your Role (if volunteering) */}
        {amIVolunteering && (
          <div className="bg-[#1c1c21] border border-orange-500/20 p-4 rounded-xl flex items-center justify-between shadow-sm shadow-orange-500/5 animate-in fade-in duration-200">
            <div>
              <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest block">Your Role</span>
              <strong className="text-white text-sm mt-0.5 block">
                {event.jobs?.find(j => j.volunteers?.includes(userId))?.label || 'General Volunteer'}
              </strong>
            </div>
            {event.jobs && event.jobs.length > 0 && (
              <button 
                onClick={onOpenJobSelection}
                className="px-3 py-1.5 bg-[#27272a]/60 hover:bg-[#27272a] text-xs font-bold text-orange-500 hover:text-orange-400 border border-[#27272a] hover:border-orange-500/20 rounded-lg transition-all cursor-pointer active:scale-97"
              >
                Switch Job
              </button>
            )}
          </div>
        )}

        {/* Action Button - Join & Follow */}
        <div className="flex space-x-3">
          <button 
            onClick={handleJoinToggle}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm text-center transition-all border cursor-pointer active:scale-98 ${
              amIVolunteering
                ? 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20 hover:text-red-400' 
                : 'bg-orange-500 text-white border-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-500/10'
            }`}
          >
            {amIVolunteering ? (
              <span className="flex items-center justify-center">
                <X size={18} className="mr-2 text-red-500" /> Leave Event
              </span>
            ) : (
              "Join Event"
            )}
          </button>

          <button 
            onClick={handleFollowToggle}
            disabled={amIVolunteering}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm text-center transition-all border ${
              amIFollowing || amIVolunteering
                ? 'bg-[#1c1c21] text-gray-300 border-[#27272a]/80' 
                : 'bg-[#1c1c21] text-gray-300 border-[#27272a]/80 hover:bg-[#27272a] hover:text-white cursor-pointer active:scale-98'
            } ${amIVolunteering ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {amIFollowing || amIVolunteering ? (
              <span className="flex items-center justify-center">
                <Heart size={16} className="mr-2 text-rose-500 fill-current" /> Following
              </span>
            ) : (
              "+ Follow"
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
        
        {/* Invite Friends Section */}
        {amIVolunteering && friends.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Invite Friends</h3>
            <div className="space-y-2">
              {friends.map(friend => (
                <div key={friend.id} className="bg-[#1c1c21] border border-[#27272a]/60 p-3 rounded-xl flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-sm shrink-0" style={{ backgroundColor: friend.color }}>
                      <span className="leading-none mt-[1px]">{friend.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <span className="text-sm font-semibold text-white">{friend.name}</span>
                  </div>
                  <button
                    onClick={() => handleInviteFriend(friend.id)}
                    disabled={sentInvites.includes(friend.id) || inviteIsLoading === friend.id}
                    className={`px-3 py-1.5 rounded-lg font-medium text-xs transition-all flex items-center ${
                      sentInvites.includes(friend.id)
                        ? 'bg-[#27272a] text-gray-400 cursor-not-allowed'
                        : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 disabled:opacity-50'
                    }`}
                  >
                    {inviteIsLoading === friend.id ? (
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    ) : sentInvites.includes(friend.id) ? (
                      <span className="flex items-center"><CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Invited</span>
                    ) : (
                      <span className="flex items-center"><UserPlus className="w-3.5 h-3.5 mr-1.5" /> Invite</span>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Updates Feed */}
        <div className="pt-2 border-t border-[#27272a]/35">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Live Updates</h3>
            {isOrganizer && (
              <span className="text-[10px] bg-orange-500/10 text-orange-500 px-2.5 py-0.5 rounded-full font-bold border border-orange-500/20">
                Organizer Mode
              </span>
            )}
          </div>

          {/* Organizer Add Update Input Panel */}
          {isOrganizer && (
            <form onSubmit={handlePostUpdate} className="mb-6 space-y-3 bg-[#1c1c21] p-4 rounded-xl border border-orange-500/15">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Post live announcement</label>
              <textarea
                rows={2}
                value={newUpdateText}
                onChange={e => setNewUpdateText(e.target.value)}
                className="w-full px-3 py-2 bg-[#141417] border border-[#27272a]/80 rounded-lg focus:ring-1 focus:ring-orange-500 outline-none text-white text-xs placeholder-gray-600 resize-none"
                placeholder="Type update message (e.g. 'Helpers arrived early!')"
                required
              />
              <button
                type="submit"
                disabled={postIsLoading || !newUpdateText.trim()}
                className="w-full py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-all cursor-pointer shadow-sm text-center flex items-center justify-center space-x-1"
              >
                <span>Post Announcement</span>
              </button>
            </form>
          )}

          {updates && updates.length > 0 ? (
            <div className="space-y-4">
              {updates.map((update, i) => (
                <div key={i} className="border-l-2 border-orange-500/40 pl-4 py-1">
                  <p className="text-[10px] text-orange-500 font-bold mb-1 uppercase tracking-wider">{update.timestamp}</p>
                  <p className="text-sm text-gray-300 leading-normal">{update.text}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-500 italic py-2 text-center">No updates posted yet.</p>
          )}
        </div>

      </div>
    </Drawer>
  );
}
