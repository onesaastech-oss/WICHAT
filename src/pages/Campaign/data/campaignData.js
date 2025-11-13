// Dummy data for Campaign Builder
export const contacts = [
  { id: 1, name: 'John Doe', phone: '+1234567890', status: 'active' },
  { id: 2, name: 'Jane Smith', phone: '+0987654321', status: 'active' },
  { id: 3, name: 'Bob Johnson', phone: '+1122334455', status: 'active' },
  { id: 4, name: 'Alice Williams', phone: '+5544332211', status: 'active' },
];

export const contactGroups = [
  { id: 1, name: 'VIP Customers', count: 150, color: 'bg-purple-500' },
  { id: 2, name: 'Newsletter Subscribers', count: 430, color: 'bg-blue-500' },
  { id: 3, name: 'New Leads', count: 89, color: 'bg-green-500' },
  { id: 4, name: 'Premium Members', count: 220, color: 'bg-yellow-500' },
];

export const templates = [
  {
    id: 1,
    name: 'Welcome Message',
    category: 'Marketing',
    content: 'Hi {{1}},\n\nWelcome to {{2}}! 🎉\n\nWe\'re excited to have you with us. Get started with 20% off your first order using code: *WELCOME20*\n\nShop now: {{3}}',
    variables: ['name', 'company', 'link'],
    approved: true
  },
  {
    id: 2,
    name: 'Order Confirmation',
    category: 'Transactional',
    content: 'Hello {{1}},\n\nYour order #{{2}} has been confirmed! ✅\n\nTotal: ${{3}}\nExpected delivery: {{4}}\n\nTrack your order: {{5}}',
    variables: ['name', 'order_id', 'amount', 'date', 'tracking_link'],
    approved: true
  },
  {
    id: 3,
    name: 'Appointment Reminder',
    category: 'Utility',
    content: 'Hi {{1}},\n\nThis is a reminder about your appointment:\n\n📅 Date: {{2}}\n🕐 Time: {{3}}\n📍 Location: {{4}}\n\nSee you soon!',
    variables: ['name', 'date', 'time', 'location'],
    approved: true
  }
];

