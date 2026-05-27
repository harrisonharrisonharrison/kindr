import { useState } from 'react';
import { initialEvents, currentUser, friends } from './data';

function App() {
  const [activeTab, setActiveTab] = useState('Events');
  const [events] = useState(initialEvents);

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
            <span className="font-bold text-xl tracking-tight text-gray-900">kindr</span>
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
        <div className="w-10 h-10 rounded-full bg-gray-300 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center">
          {/* Avatar placeholder */}
          <span className="text-gray-500 text-sm font-semibold">You</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-8 flex space-x-12">
        {/* Left Column: Event List */}
        <div className="flex-1 space-y-0">
          {events.map((event, index) => {
            // Find which friends are involved
            const involvedFriends = friends.filter(f => event.volunteers.includes(f.id));
            const amIInvolved = event.volunteers.includes(currentUser.id);
            
            return (
              <div key={event.id} className={`py-6 flex justify-between items-center ${index !== events.length - 1 ? 'border-b border-gray-200' : ''}`}>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{event.name}</h3>
                </div>
                <div className="flex space-x-1">
                  {/* Colored squares for involved people */}
                  {amIInvolved && (
                    <div className="w-4 h-4 rounded-sm border border-gray-300 bg-white shadow-sm" title="You"></div>
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
            <button className="w-full py-3 px-4 bg-black text-white rounded-md font-medium text-center hover:bg-gray-800 transition-colors">
              + Add Event
            </button>
            <button className="w-full py-3 px-4 bg-white text-black border border-gray-300 rounded-md font-medium text-center hover:bg-gray-50 transition-colors">
              + Follow Event
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-5 h-5 rounded-sm border border-gray-300 bg-white shadow-sm"></div>
              <span className="font-medium text-gray-900">You</span>
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
    </div>
  );
}

export default App;
