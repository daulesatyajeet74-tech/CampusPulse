// Transparent rule-based priority (no AI). Rules are checked top to bottom; first match wins.
const HAZARD = /(spark|shock|exposed wire|live wire|short.?circuit|fire|smoke|gas leak|injur|unsafe|collapse|broken glass|hazard|flood)/i
const OUTAGE = /(no water|outage|shortage|no supply|not available|no power|power cut|dry)/i
const FAULT = /(broken|not working|damaged|leak|stuck|crack)/i
export function suggestPriority({ title = '', description = '', category = '' }) {
  const text = `${title} ${description}`
  if (category === 'Safety') return { priority: 'High', reason: 'Safety issues are always high priority.' }
  if (category === 'Electrical') return { priority: 'High', reason: 'Electrical problems can be hazardous.' }
  if (HAZARD.test(text)) return { priority: 'High', reason: 'Text mentions a possible safety hazard.' }
  if (category === 'Water' && OUTAGE.test(text)) return { priority: 'High', reason: 'Water outage affects an essential service.' }
  if (category === 'Water') return { priority: 'Medium', reason: 'Water issue without a reported outage.' }
  if (['Infrastructure', 'Equipment'].includes(category) && FAULT.test(text))
    return { priority: 'Medium', reason: 'Something is broken or not working.' }
  return { priority: 'Low', reason: 'No hazard or outage detected; routine issue.' }
}
