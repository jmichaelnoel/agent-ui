import { useCallback } from 'react'
import { toast } from 'sonner'

import { usePlaygroundStore } from '../store'

import {
  ComboboxAgent,
  ComboboxTeam,
  type PlaygroundChatMessage
} from '@/types/playground'
import {
  getPlaygroundAgentsAPI,
  getPlaygroundStatusAPI,
  getPlaygroundTeamsAPI
} from '@/api/playground'

export function useChatActions() {
  const selectedEndpoint = usePlaygroundStore((state) => state.selectedEndpoint)
  const setMessages = usePlaygroundStore((state) => state.setMessages)
  const setSessionId = usePlaygroundStore((state) => state.setSelectedSessionId)
  const chatInputRef = usePlaygroundStore((state) => state.chatInputRef)
  const setAgents = usePlaygroundStore((state) => state.setAgents)
  const setTeams = usePlaygroundStore((state) => state.setTeams)
  const setSelectedAgentId = usePlaygroundStore((state) => state.setSelectedAgentId)
  const setSelectedModel = usePlaygroundStore((state) => state.setSelectedModel)
  const setHasStorage = usePlaygroundStore((state) => state.setHasStorage)
  const setSelectedTeamId = usePlaygroundStore((state) => state.setSelectedTeamId)
  const setMode = usePlaygroundStore((state) => state.setMode)
  const selectedAgentId = usePlaygroundStore((state) => state.selectedAgentId)
  const selectedTeamId = usePlaygroundStore((state) => state.selectedTeamId)
  const setIsEndpointActive = usePlaygroundStore((state) => state.setIsEndpointActive)
  const setIsEndpointLoading = usePlaygroundStore((state) => state.setIsEndpointLoading)

  const getStatus = useCallback(async () => {
    try {
      const status = await getPlaygroundStatusAPI(selectedEndpoint)
      return status
    } catch {
      return 503
    }
  }, [selectedEndpoint])

  const getAgents = useCallback(async () => {
    try {
      const agents = await getPlaygroundAgentsAPI(selectedEndpoint)
      return agents
    } catch {
      toast.error('Error fetching agents')
      return []
    }
  }, [selectedEndpoint])

  const getTeams = useCallback(async () => {
    try {
      const teams = await getPlaygroundTeamsAPI(selectedEndpoint)
      return teams
    } catch {
      toast.error('Error fetching teams')
      return []
    }
  }, [selectedEndpoint])

  const clearChat = useCallback(() => {
    setMessages([])
    setSessionId(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const focusChatInput = useCallback(() => {
    setTimeout(() => {
      requestAnimationFrame(() => chatInputRef?.current?.focus())
    }, 0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const addMessage = useCallback(
    (message: PlaygroundChatMessage) => {
      setMessages((prevMessages) => [...prevMessages, message])
    },
    [setMessages]
  )

  const initializePlayground = useCallback(async () => {
    setIsEndpointLoading(true)
    try {
      const status = await getStatus()
      let agents: ComboboxAgent[] = []
      let teams: ComboboxTeam[] = []
      if (status === 200) {
        setIsEndpointActive(true)
        teams = await getTeams()
        agents = await getAgents()

        if (!agentId && !teamId) {
          const currentMode = usePlaygroundStore.getState().mode

          if (currentMode === 'team' && teams.length > 0) {
            const firstTeam = teams[0]
            setSelectedTeamId(firstTeam.value)
            setSelectedTeamId(firstTeam.value)
            setSelectedModel(firstTeam.model.provider || '')
            setHasStorage(!!firstTeam.storage)
          } else if (currentMode === 'agent' && agents.length > 0) {
            const firstAgent = agents[0]
            setSelectedAgentId(firstAgent.value)
            setSelectedModel(firstAgent.model.provider || '')
            setHasStorage(!!firstAgent.storage)
            setSelectedTeamId(null)
          } else {
            if (teams.length > 0) {
              // Prioritize team mode when teams are available
              setMode('team')
              const firstTeam = teams[0]
              setSelectedTeamId(firstTeam.value)
              setSelectedTeamId(firstTeam.value)
              setSelectedModel(firstTeam.model.provider || '')
              setHasStorage(!!firstTeam.storage)
            } else if (agents.length > 0) {
              setMode('agent')
              const firstAgent = agents[0]
              setSelectedAgentId(firstAgent.value)
              setSelectedModel(firstAgent.model.provider || '')
              setHasStorage(!!firstAgent.storage)
              setSelectedTeamId(null)
            }
          }
        }
      } else {
        setIsEndpointActive(false)
        setMode('agent')
        setSelectedModel('')
        setHasStorage(false)
        setSelectedTeamId(null)
        setSelectedAgentId(null)
        setSelectedTeamId(null)
      }
      setAgents(agents)
      setTeams(teams)
      return { agents, teams }
    } catch (error) {
      console.error('Error initializing playground:', error)
      setIsEndpointActive(false)
      setMode('agent')
      setSelectedModel('')
      setHasStorage(false)
      setSelectedTeamId(null)
      setSelectedAgentId(null)
      setSelectedTeamId(null)
      setAgents([])
      setTeams([])
    } finally {
      setIsEndpointLoading(false)
    }
  }, [
    getStatus,
    getAgents,
    getTeams,
    setIsEndpointActive,
    setIsEndpointLoading,
    setAgents,
    setTeams,
    setSelectedAgentId,
    setSelectedModel,
    setHasStorage,
    setSelectedTeamId,
    setMode,
    selectedAgentId,
    selectedTeamId
  ])

  return {
    clearChat,
    addMessage,
    getAgents,
    focusChatInput,
    getTeams,
    initializePlayground
  }
}

export default useChatActions
