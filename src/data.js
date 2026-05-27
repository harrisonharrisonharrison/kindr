export const users = [
  { id: 'u1', name: 'You', color: '#FFFFFF' },
  { id: 'u2', name: 'Law', color: '#8B3A3A' },
  { id: 'u3', name: 'Shyel', color: '#1E3D2F' },
  { id: 'u4', name: 'Pradosh', color: '#2E7D96' },
];

export const currentUser = users[0];
export const friends = users.slice(1);

export const initialEvents = [
  {
    id: 'e1',
    name: 'Food Pantry',
    organizerName: 'Community Food Bank',
    location: '123 Main St, Garden Grove, CA',
    description: 'Help sort and distribute food to local families in need. We need volunteers for lifting boxes and organizing shelves.',
    time: 'Saturday, 9:00 AM - 1:00 PM',
    volunteersNeeded: 10,
    jobs: [
      { label: 'Box Lifters', needed: 4, filled: 2 },
      { label: 'Distribution', needed: 6, filled: 4 }
    ],
    supplies: ['Gloves', 'Hand Sanitizer'],
    volunteers: ['u1', 'u3'], // You and Shyel
    followers: [],
    updates: [
      { timestamp: '2 hours ago', text: 'Truck with fresh produce arrived early!' }
    ]
  },
  {
    id: 'e2',
    name: 'VenusHacks',
    organizerName: 'VenusHacks Team',
    location: 'UCI Student Center',
    description: 'Women-centric hackathon. Volunteers needed to help with registration, mentoring, and food distribution.',
    time: 'Friday 5:00 PM - Sunday 5:00 PM',
    volunteersNeeded: 20,
    jobs: [
      { label: 'Registration Desk', needed: 5, filled: 5 },
      { label: 'Food Distribution', needed: 15, filled: 8 }
    ],
    supplies: ['Lanyards', 'T-shirts'],
    volunteers: ['u4'], // Pradosh
    followers: ['u1'], // You following
    updates: [
      { timestamp: 'Yesterday', text: 'Registration layout finalized.' }
    ]
  },
  {
    id: 'e3',
    name: 'Garden Grove Evacuation',
    organizerName: 'Garden Grove Mutual Aid',
    location: 'Garden Grove High School',
    description: 'Emergency evacuation support. Residents need help transporting belongings and people to the community center. Trucks and vans highly needed.',
    time: 'Today, URGENT',
    volunteersNeeded: 50,
    jobs: [
      { label: 'Drivers with Trucks/Vans', needed: 20, filled: 5 },
      { label: 'Heavy Lifting', needed: 30, filled: 12 }
    ],
    supplies: ['Moving Boxes', 'Tape', 'Water', 'Snacks'],
    volunteers: [],
    followers: [],
    updates: [
      { timestamp: '1 hour ago', text: 'We have 5 trucks en route but need more lifting volunteers at sector B.' },
      { timestamp: '4 hours ago', text: 'Evacuation center setup complete.' }
    ]
  }
];
