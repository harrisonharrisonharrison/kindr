import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { initialEvents, friends } from '../data';
import AddEventDrawer from '../components/AddEventDrawer';
import EventDetailsDrawer from '../components/EventDetailsDrawer';
import { useAuth } from '../context/AuthContext';
import { LogOut } from 'lucide-react';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('Events');
  const [events] = useState(initialEvents);
  const { user, profile, isAuthenticated, loading, logout } = useAuth();
  const navigate = useNavigate();
  
  // Drawer states
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/auth');
    }
  }, [loading, isAuthenticated, navigate]);

  if (loading || !isAuthenticated) {
    return <div className="min-h-screen bg-[#fbfbfb] flex items-center justify-center">Loading...</div>;
  }

  // Fallback styling if profile isn't fully loaded yet
  const userColor = profile?.color || '#3B82F6';
  const userInitial = profile?.name ? profile.name.charAt(0).toUpperCase() : '?';

  return (
    <div className="min-h-screen flex flex-col bg-[#fbfbfb] font-sans">
      {/* Header / Tabs */}
      <header className="flex justify-between items-center px-8 py-4 border-b border-gray-200 bg-white">
        <div className="flex items-center space-x-8">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('Events');
            }}
            className="flex items-center space-x-2 mr-4"
          >
            <img src="/kindr.png" alt="kindr logo" className="h-8 w-8 object-contain" />
          </a>
          <div className="flex space-x-8">
            <button
              className={`text-2xl font-bold pb-2 ${activeTab === 'Events' ? 'text-black border-b-4 border-green-500' : 'text-gray-400 hover:text-gray-600'}`}
              onClick={() => setActiveTab('Events')}
            >
              Events
            </button>
            <button
              className={`text-2xl font-bold pb-2 ${activeTab === 'Your Events' ? 'text-black border-b-4 border-green-500' : 'text-gray-400 hover:text-gray-600'}`}
              onClick={() => setActiveTab('Your Events')}
            >
              Your Events
            </button>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <button 
            onClick={logout}
            className="text-gray-500 hover:text-gray-700 transition-colors p-2 rounded-full hover:bg-gray-100"
            title="Log out"
          >
            <LogOut size={20} />
          </button>
          <div 
            className="w-10 h-10 rounded-full border-2 border-white shadow-sm overflow-hidden flex items-center justify-center text-white font-bold"
            style={{ backgroundColor: userColor }}
            title={profile?.name || user.email}
          >
            {userInitial}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-8 flex space-x-12">
        {/* Left Column: Event List */}
        <div className="flex-1 space-y-0">
          {events.map((event, index) => {
            const involvedFriends = friends.filter(f => event.volunteers.includes(f.id));
            const amIInvolved = profile ? event.volunteers.includes(profile.id) : false;
            
            return (
              <div 
                key={event.id} 
                onClick={() => setSelectedEvent(event)}
                className={`py-6 flex justify-between items-center cursor-pointer transition-colors hover:bg-gray-50 -mx-4 px-4 rounded-lg ${index !== events.length - 1 ? 'border-b border-gray-200' : ''}`}
              >
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{event.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{event.time}</p>
                </div>
                <div className="flex space-x-1">
                  {amIInvolved && (
                    <div className="w-4 h-4 rounded-sm border border-gray-300 shadow-sm" style={{ backgroundColor: userColor }} title="You"></div>
                  )}
                  {involvedFriends.map(f => (
                    <div key={f.id} className="w-4 h-4 rounded-sm shadow-sm" style={{ backgroundColor: f.color }} title={f.name}></div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Sidebar */}
        <div className="w-64 flex flex-col space-y-8">
          <div className="space-y-4">
            <button 
              onClick={() => setIsAddEventOpen(true)}
              className="w-full py-3 px-4 bg-black text-white rounded-md font-medium text-center hover:bg-gray-800 transition-colors"
            >
              + Add Event
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-5 h-5 rounded-sm shadow-sm border border-gray-300" style={{ backgroundColor: userColor }}></div>
              <span className="font-medium text-gray-900">{profile?.name || 'You'}</span>
            </div>
            
            <div>
              <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Friends</h4>
              <div className="space-y-3">
                {friends.map(friend => (
                  <div key={friend.id} className="flex items-center space-x-3">
                    <div className="w-5 h-5 rounded-sm shadow-sm" style={{ backgroundColor: friend.color }}></div>
                    <span className="text-gray-700">{friend.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Drawers */}
      <AddEventDrawer 
        isOpen={isAddEventOpen} 
        onClose={() => setIsAddEventOpen(false)} 
      />
      
      <EventDetailsDrawer 
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        event={selectedEvent}
      />

    </div>
  );
}
