import { useState, useEffect } from 'react';
import { Search, UserPlus, UserMinus, Users, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

export default function FriendsView({ friends, refreshFriends }) {
  const { profile } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [addingId, setAddingId] = useState(null);
  const [sentRequests, setSentRequests] = useState([]);
  const [receivedRequests, setReceivedRequests] = useState([]);

  const fetchPendingRequests = async () => {
    if (!profile) return;
    try {
      const [sentRes, receivedRes] = await Promise.all([
        supabase.from('friendships').select('friend_id').eq('user_id', profile.id).eq('status', 'pending'),
        supabase.from('friendships').select('id, user_id, profiles!user_id(id, name, color)').eq('friend_id', profile.id).eq('status', 'pending')
      ]);

      if (sentRes.error) throw sentRes.error;
      if (receivedRes.error) throw receivedRes.error;

      setSentRequests(sentRes.data.map(r => r.friend_id));
      setReceivedRequests(receivedRes.data.map(r => ({
        requestId: r.id,
        user: r.profiles
      })));
    } catch (err) {
      console.error('Error fetching pending requests:', err);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPendingRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  // Effect to perform the search
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }
      
      setIsSearching(true);
      try {
        // Search profiles by name, excluding the current user and existing friends
        const friendIds = friends.map(f => f.id);
        const { data, error } = await supabase
          .from('profiles')
          .select('id, name, color')
          .ilike('name', `%${searchQuery}%`)
          .neq('id', profile.id)
          .limit(10);

        if (error) throw error;
        
        // Filter out people who are already friends
        const filteredResults = data.filter(p => !friendIds.includes(p.id));
        setSearchResults(filteredResults);
      } catch (err) {
        console.error('Error searching users:', err);
      } finally {
        setIsSearching(false);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, friends, profile?.id]);

  const handleAddFriend = async (friendProfile) => {
    if (!profile) return;
    setAddingId(friendProfile.id);
    
    try {
      const { error } = await supabase.from('friendships').insert([
        { user_id: profile.id, friend_id: friendProfile.id, status: 'pending' }
      ]);
      
      if (error) throw error;

      // Optimistically update sent requests
      setSentRequests(prev => [...prev, friendProfile.id]);
      
    } catch (err) {
      console.error('Error sending friend request:', err);
      alert('Failed to send request. Please try again.');
    } finally {
      setAddingId(null);
    }
  };

  const handleAcceptRequest = async (request) => {
    try {
      // Update the original request to accepted, and insert the reverse
      await supabase.from('friendships').update({ status: 'accepted' }).eq('id', request.requestId);
      await supabase.from('friendships').insert([
        { user_id: profile.id, friend_id: request.user.id, status: 'accepted' }
      ]);
      
      // Refresh both lists
      fetchPendingRequests();
      if (refreshFriends) refreshFriends();
    } catch (err) {
      console.error('Error accepting request:', err);
    }
  };

  const handleDeclineRequest = async (requestId) => {
    try {
      await supabase.from('friendships').delete().eq('id', requestId);
      fetchPendingRequests();
    } catch (err) {
      console.error('Error declining request:', err);
    }
  };

  const handleRemoveFriend = async (friendId) => {
    if (!profile) return;
    try {
      await Promise.all([
        supabase.from('friendships').delete().match({ user_id: profile.id, friend_id: friendId }),
        supabase.from('friendships').delete().match({ user_id: friendId, friend_id: profile.id })
      ]);
      if (refreshFriends) refreshFriends();
    } catch (err) {
      console.error('Error removing friend:', err);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0b0b0c]">
      <header className="flex justify-between items-center px-8 py-5 border-b border-[#1e1e24]/40 bg-[#0c0c0f]/80 backdrop-blur-md sticky top-0 z-10">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center">
            <Users className="mr-2 text-emerald-500" /> Mutual Aid Network
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">Find and connect with community members.</p>
        </div>
      </header>

      <div className="p-8 space-y-8 flex-1 overflow-y-auto">
        
        {/* Search Section */}
        <section className="bg-[#141417] border border-[#27272a]/20 p-6 rounded-2xl">
          <div className="relative mb-6">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#1c1c21] border border-[#27272a] text-white rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all placeholder-gray-500"
            />
          </div>

          {/* Search Results */}
          {isSearching && (
            <div className="flex justify-center py-4">
              <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
            </div>
          )}

          {!isSearching && searchResults.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Search Results</h4>
              {searchResults.map(user => (
                <div key={user.id} className="flex items-center justify-between bg-[#1c1c21] p-3 rounded-xl border border-[#27272a]/40">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-sm" style={{ backgroundColor: user.color }}>
                      <span className="leading-none mt-[1px]">{user.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{user.name}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAddFriend(user)}
                    disabled={addingId === user.id || sentRequests.includes(user.id)}
                    className={`px-3 py-1.5 rounded-lg font-medium text-sm transition-all flex items-center ${
                      sentRequests.includes(user.id)
                        ? 'bg-[#27272a] text-gray-400 cursor-not-allowed'
                        : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 disabled:opacity-50'
                    }`}
                  >
                    {addingId === user.id ? (
                      <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                    ) : sentRequests.includes(user.id) ? (
                      <span className="flex items-center"><Users className="w-4 h-4 mr-1.5" /> Requested</span>
                    ) : (
                      <span className="flex items-center"><UserPlus className="w-4 h-4 mr-1.5" /> Add Friend</span>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}

          {!isSearching && searchQuery.trim() && searchResults.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">No new users found matching "{searchQuery}".</p>
          )}
        </section>

        {/* Received Requests Section */}
        {receivedRequests.length > 0 && (
          <section className="bg-[#141417] border border-orange-500/30 p-6 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-orange-500"></div>
            <h3 className="text-lg font-bold text-white tracking-tight mb-4 flex items-center">
              Friend Requests <span className="ml-2 bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">{receivedRequests.length}</span>
            </h3>
            <div className="space-y-3">
              {receivedRequests.map(req => (
                <div key={req.requestId} className="flex items-center justify-between bg-[#1c1c21] p-3 rounded-xl border border-[#27272a]/40">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-sm" style={{ backgroundColor: req.user.color }}>
                      <span className="leading-none mt-[1px]">{req.user.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{req.user.name}</p>
                      <p className="text-xs text-gray-400">Wants to connect</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleAcceptRequest(req)}
                      className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium text-sm transition-all"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleDeclineRequest(req.requestId)}
                      className="px-3 py-1.5 bg-[#27272a] hover:bg-[#3f3f46] text-gray-300 rounded-lg font-medium text-sm transition-all"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Current Friends Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white tracking-tight">Your Friends</h3>
            <span className="text-xs font-medium text-gray-500 bg-[#141417] px-2 py-0.5 rounded-md border border-[#27272a]/50">
              {friends.length} total
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {friends.map((friend) => (
              <div key={friend.id} className="bg-[#141417] border border-[#27272a]/20 p-4 rounded-xl flex items-center justify-between group hover:border-emerald-500/30 transition-all">
                <div className="flex items-center space-x-4 min-w-0">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm shrink-0" style={{ backgroundColor: friend.color }}>
                    <span className="leading-none mt-[1px]">{friend.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-base font-semibold text-white truncate group-hover:text-emerald-500 transition-colors">{friend.name}</p>
                    <p className="text-xs text-gray-400">Mutual Aid Partner</p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveFriend(friend.id)}
                  className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  title="Remove Friend"
                >
                  <UserMinus className="w-5 h-5" />
                </button>
              </div>
            ))}

            {friends.length === 0 && (
              <div className="col-span-full text-center py-8 bg-[#141417] border border-[#27272a]/20 rounded-xl">
                <Users className="w-8 h-8 text-gray-500 mx-auto mb-2 opacity-50" />
                <p className="text-sm text-gray-400">You haven't added any friends yet.</p>
                <p className="text-xs text-gray-500 mt-1">Search for usernames above to connect!</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
