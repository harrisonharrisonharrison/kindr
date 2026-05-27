import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AddEventDrawer from '../components/AddEventDrawer';
import EventDetailsDrawer from '../components/EventDetailsDrawer';
import FriendsView from '../components/FriendsView';
import ImpactView from '../components/ImpactView';
import UpdatesView from '../components/UpdatesView';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { 
  LogOut, 
  LayoutGrid, 
  Users, 
  Heart, 
  Bell, 
  Plus, 
  MapPin, 
  Clock, 
  ChevronRight 
} from 'lucide-react';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('Events');
  const [events, setEvents] = useState([]);
  const [liveParticipants, setLiveParticipants] = useState([]);
  const { profile, isAuthenticated, loading, logout } = useAuth();
  const navigate = useNavigate();
  
  // Far-left sidebar active state
  const [activeNav, setActiveNav] = useState('dashboard');
  
  // Live Friends State
  const [liveFriends, setLiveFriends] = useState([]);

  // Drawer states
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const fetchData = async () => {
    if (!profile) return;
    
    // Fetch events with organizer info and event_participants
    const { data: eventsData, error: eventsError } = await supabase
      .from('events')
      .select('*, organizer:profiles!organizer_id(id, name, color), event_participants(*)')
      .order('time', { ascending: true });
    
    // Fetch all participants globally to compute dashboard counts and feed ImpactView
    const { data: participantsData } = await supabase
      .from('event_participants')
      .select('*');

    // Fetch friends
    const { data: friendsData } = await supabase
      .from('friendships')
      .select('*, friend:profiles!friend_id(id, name, color)')
      .eq('user_id', profile.id)
      .eq('status', 'accepted');

    if (eventsData) {
      const mapped = eventsData.map(event => ({
        id: event.id,
        name: event.name,
        location: event.location,
        description: event.description,
        time: event.time,
        volunteersNeeded: event.volunteers_needed,
        supplies: event.supplies || [],
        jobs: event.jobs || [],
        volunteers: (event.event_participants || [])
          .filter(p => p.role === 'volunteer')
          .map(p => p.user_id),
        followers: (event.event_participants || [])
          .filter(p => p.role === 'follower')
          .map(p => p.user_id),
        organizer_id: event.organizer_id,
        organizer: event.organizer
      }));
      setEvents(mapped);
      
      // Keep details drawer updated in real-time
      if (selectedEvent) {
        const updatedSelected = mapped.find(e => e.id === selectedEvent.id);
        if (updatedSelected) {
          setSelectedEvent(updatedSelected);
        }
      }
    }
    
    if (participantsData) setLiveParticipants(participantsData);
    if (friendsData) setLiveFriends(friendsData.map(f => f.friend));
  };

  useEffect(() => {
    if (isAuthenticated) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, isAuthenticated]);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/auth');
    }
  }, [loading, isAuthenticated, navigate]);

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0b0b0c] flex items-center justify-center text-gray-400 font-sans">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <span>Syncing with Kindr...</span>
        </div>
      </div>
    );
  }

  const userColor = profile?.color || '#f97316';
  const userInitial = profile?.name ? profile.name.charAt(0).toUpperCase() : '?';

  // Metrics calculations
  const totalEvents = events.length;
  const volunteeredEvents = liveParticipants.filter(p => p.user_id === profile?.id && p.role === 'volunteer').length;
  const activeFriends = liveFriends.length;
  
  const totalNeeded = events.reduce((acc, e) => acc + (e.volunteersNeeded || 0), 0);
  const totalFilled = events.reduce((acc, e) => {
    return acc + liveParticipants.filter(p => p.event_id === e.id && p.role === 'volunteer').length;
  }, 0);
  const spotsLeft = Math.max(0, totalNeeded - totalFilled);
  const filledPercentage = totalNeeded > 0 ? Math.round((totalFilled / totalNeeded) * 100) : 0;

  // Filter events based on active tab
  const filteredEvents = events.filter(event => {
    if (activeTab === 'Events') return true;
    if (activeTab === 'Your Events') {
      return liveParticipants.some(p => p.event_id === event.id && p.user_id === profile?.id && p.role === 'volunteer');
    }
    return true;
  });

  const handleFollowEvent = async (e, eventId, isCurrentlyFollowing) => {
    e.stopPropagation(); // Prevent opening event details drawer
    if (!profile) return;
    
    try {
      if (isCurrentlyFollowing) {
        // Unfollow
        await supabase.from('event_participants').delete().match({ event_id: eventId, user_id: profile.id, role: 'follower' });
      } else {
        // Follow
        await supabase.from('event_participants').insert({ event_id: eventId, user_id: profile.id, role: 'follower' });
      }
      fetchData(); // Refresh everything
    } catch (err) {
      console.error('Error following event:', err);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#0b0b0c] text-[#f3f4f6] font-sans antialiased overflow-hidden">
      
      {/* COLUMN 1: Far-Left Thin Icon Sidebar */}
      <aside className="w-16 md:w-20 bg-[#0e0e11] border-r border-[#1e1e24]/40 flex flex-col items-center justify-between py-6 flex-shrink-0">
        <div className="flex flex-col items-center space-y-8 w-full">
          {/* Logo */}
          <div className="w-10 h-10 bg-gradient-to-tr from-orange-500 to-amber-400 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
            <img src="/kindr.png" alt="kindr" className="h-6 w-6 object-contain invert brightness-0" />
          </div>

          {/* Navigation Icon List */}
          <nav className="flex flex-col space-y-4 w-full px-2">
            <button
              onClick={() => setActiveNav('dashboard')}
              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                activeNav === 'dashboard'
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                  : 'text-gray-400 hover:text-white hover:bg-[#1a1a22]'
              }`}
              title="Dashboard"
            >
              <LayoutGrid size={20} />
            </button>
            <button
              onClick={() => setActiveNav('friends')}
              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                activeNav === 'friends'
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                  : 'text-gray-400 hover:text-white hover:bg-[#1a1a22]'
              }`}
              title="Mutual Aid Network"
            >
              <Users size={20} />
            </button>
            <button
              onClick={() => setActiveNav('impact')}
              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                activeNav === 'impact'
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                  : 'text-gray-400 hover:text-white hover:bg-[#1a1a22]'
              }`}
              title="Your Impact"
            >
              <Heart size={20} />
            </button>
            <button
              onClick={() => setActiveNav('updates')}
              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                activeNav === 'updates'
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                  : 'text-gray-400 hover:text-white hover:bg-[#1a1a22]'
              }`}
              title="Announcements"
            >
              <Bell size={20} />
            </button>
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="flex flex-col items-center space-y-4">
          <button 
            onClick={logout}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-400 hover:text-red-400 hover:bg-[#1a1a22] transition-all"
            title="Log out"
          >
            <LogOut size={20} />
          </button>
        </div>
      </aside>

      {/* COLUMN 2: Secondary Navigation Sidebar */}
      <aside className="hidden lg:flex w-64 bg-[#141417] border-r border-[#1e1e24]/40 flex-col justify-between p-6 flex-shrink-0">
        <div className="space-y-8">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center">
              Kindr <span className="text-orange-500 ml-1.5 font-semibold text-xs bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/20">Labs</span>
            </h1>
            <p className="text-xs text-gray-500 mt-1">Community Mutual Aid</p>
          </div>

          {/* Navigation Links */}
          <div className="space-y-1">
            <button
              onClick={() => setActiveTab('Events')}
              className={`w-full text-left px-4 py-2.5 rounded-xl font-medium text-sm transition-all flex items-center justify-between ${
                activeTab === 'Events'
                  ? 'bg-orange-500/10 text-orange-500 border-l-4 border-orange-500'
                  : 'text-gray-400 hover:text-white hover:bg-[#1c1c21]'
              }`}
            >
              <span>Explore Events</span>
              <span className="bg-[#1e1e24] text-gray-400 text-xs px-2 py-0.5 rounded-md font-semibold">{events.length}</span>
            </button>
            <button
              onClick={() => setActiveTab('Your Events')}
              className={`w-full text-left px-4 py-2.5 rounded-xl font-medium text-sm transition-all flex items-center justify-between ${
                activeTab === 'Your Events'
                  ? 'bg-orange-500/10 text-orange-500 border-l-4 border-orange-500'
                  : 'text-gray-400 hover:text-white hover:bg-[#1c1c21]'
              }`}
            >
              <span>Your Volunteering</span>
              <span className="bg-[#1e1e24] text-gray-400 text-xs px-2 py-0.5 rounded-md font-semibold">{volunteeredEvents}</span>
            </button>
          </div>

          {/* Friends Section */}
          <div className="pt-4 border-t border-[#1e1e24]/50">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">Mutual Aid Network</h4>
            <div className="space-y-3">
              {liveFriends.map(friend => (
                <div key={friend.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-[#1c1c21] transition-all">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 rounded-full shadow-inner" style={{ backgroundColor: friend.color }}></div>
                    <span className="text-sm text-gray-300 font-medium">{friend.name}</span>
                  </div>
                  <span className="text-xs text-gray-500 font-medium">Friend</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* User profile section at the bottom */}
        <div className="flex items-center justify-between p-3 bg-[#1c1c21] rounded-2xl border border-[#27272a]/20">
          <div className="flex items-center space-x-3 min-w-0">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0"
              style={{ backgroundColor: userColor }}
            >
              {userInitial}
            </div>
            <div className="truncate leading-tight">
              <p className="text-sm font-semibold text-white truncate">{profile?.name || 'User'}</p>
              <p className="text-xs text-gray-400 truncate">Active Volunteer</p>
            </div>
          </div>
        </div>
      </aside>

      {/* COLUMN 3: Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {activeNav === 'friends' ? (
          <FriendsView friends={liveFriends} refreshFriends={fetchData} />
        ) : activeNav === 'impact' ? (
          <ImpactView liveEvents={events} liveParticipants={liveParticipants} profile={profile} />
        ) : activeNav === 'updates' ? (
          <UpdatesView liveEvents={events} liveParticipants={liveParticipants} profile={profile} />
        ) : (
          <>
        {/* Header */}
        <header className="flex justify-between items-center px-8 py-5 border-b border-[#1e1e24]/40 bg-[#0c0c0f]/80 backdrop-blur-md sticky top-0 z-10">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white">Overview</h2>
            <p className="text-sm text-gray-400 mt-0.5">Welcome back, {profile?.name || 'friend'}!</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setIsAddEventOpen(true)}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold text-sm transition-all flex items-center shadow-lg shadow-orange-500/10 active:scale-95 cursor-pointer"
            >
              <Plus size={16} className="mr-1.5" /> Add Event
            </button>
          </div>
        </header>

        {/* Dashboard Grid */}
        <div className="p-8 space-y-8 flex-1">
          
          {/* Section 1: Overview Cards */}
          <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Card 1: Total Events */}
            <div className="bg-[#141417] border border-[#27272a]/20 p-5 rounded-2xl flex flex-col justify-between hover:border-orange-500/25 transition-all relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-orange-500"></div>
              <span className="text-gray-400 text-xs font-medium uppercase tracking-wider">Total Events</span>
              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-white">{totalEvents}</span>
                <span className="text-xs text-orange-500 font-semibold bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/15">Active</span>
              </div>
            </div>

            {/* Card 2: Volunteering */}
            <div className="bg-[#141417] border border-[#27272a]/20 p-5 rounded-2xl flex flex-col justify-between hover:border-blue-500/25 transition-all relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
              <span className="text-gray-400 text-xs font-medium uppercase tracking-wider">Your Commitments</span>
              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-white">{volunteeredEvents}</span>
                <span className="text-xs text-blue-500 font-semibold bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/15">Joined</span>
              </div>
            </div>

            {/* Card 3: Network Friends */}
            <div className="bg-[#141417] border border-[#27272a]/20 p-5 rounded-2xl flex flex-col justify-between hover:border-emerald-500/25 transition-all relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
              <span className="text-gray-400 text-xs font-medium uppercase tracking-wider">Active Friends</span>
              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-white">{activeFriends}</span>
                <span className="text-xs text-emerald-500 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/15">Connected</span>
              </div>
            </div>

            {/* Card 4: Open Spots */}
            <div className="bg-[#141417] border border-[#27272a]/20 p-5 rounded-2xl flex flex-col justify-between hover:border-amber-500/25 transition-all relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
              <span className="text-gray-400 text-xs font-medium uppercase tracking-wider">Vacant Spots</span>
              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-white">{spotsLeft}</span>
                <span className="text-xs text-amber-500 font-semibold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/15">Remaining</span>
              </div>
            </div>
          </section>

          {/* Section 2: Split Area (Events List on Left, Donut Metrics on Right) */}
          <section className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            
            {/* Left Box: Event Listings */}
            <div className="xl:col-span-2 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-white tracking-tight flex items-center">
                  Active Community Actions
                  <span className="ml-2 text-xs font-medium text-gray-500 bg-[#141417] px-2 py-0.5 rounded-md border border-[#27272a]/50">
                    {filteredEvents.length} listed
                  </span>
                </h3>
              </div>

              <div className="space-y-3">
                {filteredEvents.map((event) => {
                  const eventVolunteers = liveParticipants.filter(p => p.event_id === event.id && p.role === 'volunteer');
                  const volunteerIds = eventVolunteers.map(v => v.user_id);
                  const involvedFriends = liveFriends.filter(f => volunteerIds.includes(f.id));
                  
                  const myParticipantRecord = liveParticipants.find(p => p.user_id === profile?.id && p.event_id === event.id);
                  const amIInvolved = myParticipantRecord?.role === 'volunteer';
                  const amIFollowing = myParticipantRecord?.role === 'follower';
                  
                  const eventDate = new Date(event.time);
                  const isUrgent = (eventDate - new Date()) < 86400000 && (eventDate - new Date()) > 0;
                  const formattedTime = eventDate.toLocaleDateString() + ' ' + eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                  return (
                    <div 
                      key={event.id} 
                      onClick={() => setSelectedEvent(event)}
                      className="bg-[#141417] hover:bg-[#1a1a20] border border-[#27272a]/20 p-5 rounded-2xl transition-all cursor-pointer flex justify-between items-center group relative"
                    >
                      {/* Left accent bar for urgent events */}
                      {isUrgent && (
                        <div className="absolute top-0 left-0 w-1 h-full bg-red-500 rounded-l-2xl animate-pulse"></div>
                      )}

                      <div className="space-y-2 min-w-0 pr-4">
                        <div className="flex items-center space-x-2 flex-wrap">
                          <h4 className="text-base font-bold text-white tracking-tight group-hover:text-orange-500 transition-colors">
                            {event.name}
                          </h4>
                          {isUrgent && (
                            <span className="text-[10px] uppercase font-extrabold tracking-wider bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full border border-red-500/20">
                              Urgent
                            </span>
                          )}
                          {amIInvolved && (
                            <span className="text-[10px] uppercase font-extrabold tracking-wider bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full border border-emerald-500/20">
                              Joined
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-4 text-xs text-gray-400 flex-wrap">
                          <div className="flex items-center space-x-1.5">
                            <Clock size={12} className="text-gray-500" />
                            <span className="truncate">{formattedTime}</span>
                          </div>
                          <div className="flex items-center space-x-1.5">
                            <MapPin size={12} className="text-gray-500" />
                            <span className="truncate max-w-[150px] md:max-w-[250px]">{event.location?.split(',')[0]}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right Avatars & Action */}
                      <div className="flex items-center space-x-4 shrink-0">
                        {/* Overlapping circular avatars */}
                        <div className="flex -space-x-2 overflow-hidden items-center mr-2">
                          {amIInvolved && (
                            <div 
                              className="inline-block h-7 w-7 rounded-full border border-[#141417] text-white flex items-center justify-center text-[10px] font-bold shadow-md select-none shrink-0" 
                              style={{ backgroundColor: userColor }}
                              title="You"
                            >
                              {userInitial}
                            </div>
                          )}
                          {involvedFriends.map(f => (
                            <div 
                              key={f.id} 
                              className="inline-block h-7 w-7 rounded-full border border-[#141417] text-white flex items-center justify-center text-[10px] font-bold shadow-md select-none shrink-0"
                              style={{ backgroundColor: f.color }}
                              title={f.name}
                            >
                              {f.name.charAt(0).toUpperCase()}
                            </div>
                          ))}
                          {eventVolunteers.length === 0 && (
                            <span className="text-[10px] text-gray-500 uppercase tracking-widest pl-2">No signups</span>
                          )}
                        </div>
                        
                        <button 
                          onClick={(e) => handleFollowEvent(e, event.id, amIFollowing)}
                          className={`p-2 rounded-full transition-all flex items-center justify-center ${amIFollowing ? 'bg-rose-500/20 text-rose-500' : 'bg-[#27272a]/50 text-gray-400 hover:text-rose-500 hover:bg-rose-500/10'}`}
                          title={amIFollowing ? "Unfollow" : "Follow"}
                        >
                          <Heart size={16} className={amIFollowing ? "fill-current" : ""} />
                        </button>
                        
                        <div className="text-gray-500 group-hover:text-white transition-colors">
                          <ChevronRight size={18} />
                        </div>
                      </div>
                    </div>
                  );
                })}

                {filteredEvents.length === 0 && (
                  <div className="text-center py-12 bg-[#141417] border border-[#27272a]/20 rounded-2xl">
                    <p className="text-sm text-gray-400 italic">No events found matching this filter.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Box: Metrics & Stat Chart */}
            <div className="bg-[#141417] border border-[#27272a]/20 p-6 rounded-2xl flex flex-col justify-between items-center text-center space-y-6">
              <div className="w-full text-left">
                <h3 className="text-lg font-bold text-white tracking-tight">Staffing Level</h3>
                <p className="text-xs text-gray-500 mt-0.5">Overall spots filled across all events</p>
              </div>

              {/* SVG Circular Donut Chart */}
              <div className="relative flex items-center justify-center">
                <svg className="w-40 h-40 transform -rotate-90">
                  <circle
                    cx="80"
                    cy="80"
                    r="64"
                    className="stroke-[#27272a]/40"
                    strokeWidth="12"
                    fill="transparent"
                  />
                  <circle
                    cx="80"
                    cy="80"
                    r="64"
                    className="stroke-orange-500 transition-all duration-1000 ease-out"
                    strokeWidth="12"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 64}
                    strokeDashoffset={2 * Math.PI * 64 * (1 - filledPercentage / 100)}
                    strokeLinecap="round"
                  />
                </svg>
                {/* Center text inside the donut */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-extrabold text-white tracking-tighter">{filledPercentage}%</span>
                  <span className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">Filled</span>
                </div>
              </div>

              {/* Statistics Breakdown Legend */}
              <div className="w-full space-y-2 pt-4 border-t border-[#1e1e24]/40">
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center space-x-2">
                    <div className="w-2.5 h-2.5 bg-orange-500 rounded-full"></div>
                    <span className="text-gray-400">Total Filled Spots</span>
                  </div>
                  <span className="text-white font-semibold">{totalFilled}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center space-x-2">
                    <div className="w-2.5 h-2.5 bg-[#27272a] rounded-full"></div>
                    <span className="text-gray-400">Vacant Open Spots</span>
                  </div>
                  <span className="text-white font-semibold">{spotsLeft}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center space-x-2">
                    <div className="w-2.5 h-2.5 bg-blue-500 rounded-full"></div>
                    <span className="text-gray-400">Target Volunteers</span>
                  </div>
                  <span className="text-white font-semibold">{totalNeeded}</span>
                </div>
              </div>
            </div>

          </section>
        </div>
          </>
        )}
      </main>

      {/* Drawers */}
      <AddEventDrawer 
        isOpen={isAddEventOpen} 
        onClose={() => setIsAddEventOpen(false)} 
        onEventAdded={fetchEvents}
      />
      
      <EventDetailsDrawer 
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        event={selectedEvent}
        onUpdate={fetchEvents}
      />

    </div>
  );
}
