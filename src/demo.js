const d = n => new Date(Date.now() - n * 864e5).toISOString()
export const DEMO = [
  ['Sparking socket in Lab 3', 'Electrical', 'Block C, Lab 3', 'Socket near the window sparks when plugged in.', 'High', 'Electrical problems can be hazardous.', 'Submitted', 0],
  ['No water in hostel washroom', 'Water', 'Boys Hostel, Floor 2', 'No water supply since morning.', 'High', 'Water outage affects an essential service.', 'In Progress', 1],
  ['Projector not working', 'Equipment', 'Room 204, Main Building', 'Projector shows no signal.', 'Medium', 'Something is broken or not working.', 'In Progress', 2],
  ['Broken bench in courtyard', 'Infrastructure', 'Central Courtyard', 'Two benches have broken slats.', 'Medium', 'Something is broken or not working.', 'Resolved', 5],
  ['Dustbins overflowing', 'Cleanliness', 'Canteen', 'Bins not emptied for two days.', 'Low', 'No hazard or outage detected; routine issue.', 'Submitted', 3],
].map(([title, category, location, description, priority, priority_reason, status, n], i) =>
  ({ id: `demo-${i}`, title, category, location, description, priority, priority_reason, status, created_at: d(n) }))
