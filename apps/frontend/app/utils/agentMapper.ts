/**
 * Agent name mapping configuration
 * Maps internal agent IDs to user-friendly display names
 * 
 * To add a new agent:
 * 1. Add the mapping here: 'InternalAgentId': 'Display Name'
 * 2. The agent badge will automatically use the display name
 * 
 * Example:
 * ```
 * NewAgent: 'New Agent Display Name'
 * ```
 */

export const AGENT_DISPLAY_NAMES: Record<string, string> = {
  PolicyAgent: 'Policy Manager Agent',
  VetDocAgent: 'Veterinary Doctor Agent',
  BookingAgent: 'Booking Manager Agent',
}

/**
 * Get user-friendly agent display name
 * @param agentId - Internal agent identifier
 * @returns User-friendly agent name or original ID if not mapped
 */
export function getAgentDisplayName(agentId: string | undefined): string | undefined {
  if (!agentId) return undefined
  
  return AGENT_DISPLAY_NAMES[agentId] || agentId
}

/**
 * Get agent icon based on agent type
 * Returns SVG path data for the agent icon
 * @param agentId - Internal agent identifier
 * @returns SVG icon component name or default icon
 */
export function getAgentIcon(agentId: string | undefined): string {
  if (!agentId) return 'default'
  
  const iconMap: Record<string, string> = {
    PolicyAgent: 'shield',
    VetDocAgent: 'medical',
    BookingAgent: 'calendar',
  }
  
  return iconMap[agentId] || 'default'
}

