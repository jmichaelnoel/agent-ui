import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { TextArea } from '@/components/ui/textarea'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@/components/ui/select'
import Icon from '@/components/ui/icon'
import { getProviderIcon } from '@/lib/modelProvider'
import { truncateText, cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import Tooltip from '@/components/ui/tooltip'
import DeleteSessionModal from '@/components/playground/Sidebar/Sessions/DeleteSessionModal'
import { ChatArea } from '@/components/playground/ChatArea'

// Mock Data
const MOCK_AGENTS = [
  { value: 'agent-1', label: 'Data Analyst', model: { provider: 'openai' }, storage: true },
  { value: 'agent-2', label: 'Code Assistant', model: { provider: 'anthropic' }, storage: true },
  { value: 'agent-3', label: 'Research Helper', model: { provider: 'gemini' }, storage: false }
]

const MOCK_TEAMS = [
  { value: 'team-1', label: 'Development Team', model: { provider: 'openai' }, storage: true },
  { value: 'team-2', label: 'Analytics Team', model: { provider: 'mistral' }, storage: true }
]

const MOCK_SESSIONS = [
  { session_id: 'session-1', title: 'Data analysis project', created_at: 1735686000 },
  { session_id: 'session-2', title: 'Code review discussion', created_at: 1735682400 },
  { session_id: 'session-3', title: 'API integration help', created_at: 1735678800 }
]

const MOCK_MESSAGES = [
  {
    role: 'user' as const,
    content: 'Hello! Can you help me with analyzing some data?',
    created_at: 1735689300
  },
  {
    role: 'agent' as const,
    content: 'Hello! I\'d be happy to help you analyze data. What type of data are you working with?',
    created_at: 1735689320,
    tool_calls: [
      {
        role: 'tool' as const,
        content: 'Data analysis tools initialized',
        tool_call_id: 'tool-1',
        tool_name: 'data_analyzer',
        tool_args: { type: 'csv' },
        tool_call_error: false,
        metrics: { time: 150 },
        created_at: 1735689315
      }
    ],
    extra_data: {
      reasoning_steps: [
        { title: 'Analyzing request', result: 'User needs data analysis help', reasoning: 'The user is asking for help with data analysis' },
        { title: 'Preparing tools', result: 'Data tools ready', reasoning: 'Setting up appropriate analysis tools' }
      ]
    }
  }
]

type Mode = 'agent' | 'team'

// Session Item Component
const SessionItem = ({ 
  session, 
  isSelected, 
  onSelect, 
  onDelete 
}: { 
  session: any; 
  isSelected: boolean; 
  onSelect: () => void; 
  onDelete: () => void;
}) => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  return (
    <>
      <div
        className={cn(
          'group flex h-11 w-full items-center justify-between rounded-lg px-3 py-2 transition-colors duration-200',
          isSelected
            ? 'cursor-default bg-primary/10'
            : 'cursor-pointer bg-background-secondary hover:bg-background-secondary/80'
        )}
        onClick={onSelect}
      >
        <div className="flex flex-col gap-1">
          <h4 className={cn('text-sm font-medium', isSelected && 'text-primary')}>
            {truncateText(session.title, 20)}
          </h4>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="transform opacity-0 transition-all duration-200 ease-in-out group-hover:opacity-100"
          onClick={(e) => {
            e.stopPropagation()
            setIsDeleteModalOpen(true)
          }}
        >
          <Icon type="trash" size="xs" />
        </Button>
      </div>
      <DeleteSessionModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onDelete={() => {
          onDelete()
          setIsDeleteModalOpen(false)
        }}
        isDeleting={false}
      />
    </>
  )
}

// Session Blank State
const SessionBlankState = ({ hasStorage }: { hasStorage: boolean }) => (
  <div className="mt-1 flex items-center justify-center rounded-lg bg-background-secondary/50 pb-6 pt-4">
    <div className="flex flex-col items-center gap-1">
      <div className="mb-2">
        <Icon type="agno" size="md" className="opacity-20" />
      </div>
      <div className="flex flex-col items-center gap-2">
        <h3 className="text-sm font-medium text-primary">No Sessions found</h3>
        <p className="max-w-[210px] text-center text-sm text-muted">
          {hasStorage ? 'No session records yet. Start a conversation to create one.' : 'Enable storage to see sessions.'}
        </p>
      </div>
    </div>
  </div>
)

export default function AppUI() {
  // Local state management
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [selectedEndpoint, setSelectedEndpoint] = useState('http://localhost:7777')
  const [isEndpointActive, setIsEndpointActive] = useState(true)
  const [isEndpointLoading, setIsEndpointLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [endpointValue, setEndpointValue] = useState('http://localhost:7777')
  const [isHovering, setIsHovering] = useState(false)
  const [isRotating, setIsRotating] = useState(false)
  
  const [mode, setMode] = useState<Mode>('team')
  const [selectedAgent, setSelectedAgent] = useState(MOCK_AGENTS[0].value)
  const [selectedTeam, setSelectedTeam] = useState(MOCK_TEAMS[0].value)
  const [selectedModel, setSelectedModel] = useState(MOCK_TEAMS[0].model.provider)
  const [hasStorage, setHasStorage] = useState(true)
  
  const [sessions, setSessions] = useState(MOCK_SESSIONS)
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [isSessionsLoading] = useState(false)
  
  const [messages, setMessages] = useState<any[]>([])

  const currentEntities = mode === 'team' ? MOCK_TEAMS : MOCK_AGENTS
  const currentValue = mode === 'team' ? selectedTeam : selectedAgent

  // Handlers
  const handleSaveEndpoint = () => {
    setSelectedEndpoint(endpointValue)
    setIsEditing(false)
    setIsHovering(false)
    toast.success('Endpoint updated')
  }

  const handleCancelEdit = () => {
    setEndpointValue(selectedEndpoint)
    setIsEditing(false)
    setIsHovering(false)
  }

  const handleRefresh = () => {
    setIsRotating(true)
    setTimeout(() => setIsRotating(false), 500)
    toast.success('Refreshed successfully')
  }

  const handleModeChange = (newMode: Mode) => {
    if (newMode === mode) return
    setMode(newMode)
    setMessages([])
    setSelectedSessionId(null)
    
    if (newMode === 'team') {
      setSelectedModel(MOCK_TEAMS[0].model.provider)
      setHasStorage(MOCK_TEAMS[0].storage || false)
    } else {
      setSelectedModel(MOCK_AGENTS[0].model.provider)
      setHasStorage(MOCK_AGENTS[0].storage || false)
    }
  }

  const handleEntityChange = (value: string) => {
    const selectedEntity = currentEntities.find(item => item.value === value)
    
    if (mode === 'team') {
      setSelectedTeam(value)
    } else {
      setSelectedAgent(value)
    }
    
    setSelectedModel(selectedEntity?.model.provider || '')
    setHasStorage(selectedEntity?.storage || false)
    setMessages([])
    setSelectedSessionId(null)
    
    setTimeout(() => chatInputRef.current?.focus(), 100)
  }

  const handleNewChat = () => {
    setMessages([])
    setSelectedSessionId(null)
    setTimeout(() => chatInputRef.current?.focus(), 100)
  }

  const handleSessionSelect = (sessionId: string) => {
    setSelectedSessionId(sessionId)
    // Load mock conversation for the session
    setMessages([...MOCK_MESSAGES])
  }

  const handleSessionDelete = (sessionId: string) => {
    setSessions(prev => prev.filter(s => s.session_id !== sessionId))
    if (selectedSessionId === sessionId) {
      setSelectedSessionId(null)
      setMessages([])
    }
    toast.success('Session deleted')
  }

  // Sidebar Component
  const Sidebar = () => (
    <motion.aside
      className="relative flex h-screen shrink-0 grow-0 flex-col overflow-hidden px-2 py-3 font-dmmono"
      initial={{ width: '16rem' }}
      animate={{ width: isCollapsed ? '2.5rem' : '16rem' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <motion.button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute right-2 top-2 z-10 p-1"
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        type="button"
        whileTap={{ scale: 0.95 }}
      >
        <Icon
          type="sheet"
          size="xs"
          className={`transform ${isCollapsed ? 'rotate-180' : 'rotate-0'}`}
        />
      </motion.button>
      
      <motion.div
        className="w-60 space-y-5"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: isCollapsed ? 0 : 1, x: isCollapsed ? -20 : 0 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        style={{ pointerEvents: isCollapsed ? 'none' : 'auto' }}
      >
        {/* Header */}
        <div className="flex items-center gap-2">
          <Icon type="agno" size="xs" />
          <span className="text-xs font-medium uppercase text-white">Agent UI</span>
        </div>

        {/* New Chat Button */}
        <Button
          onClick={handleNewChat}
          disabled={messages.length === 0}
          size="lg"
          className="h-9 w-full rounded-xl bg-primary text-xs font-medium text-background hover:bg-primary/80"
        >
          <Icon type="plus-icon" size="xs" className="text-background" />
          <span className="uppercase">New Chat</span>
        </Button>

        {/* Endpoint */}
        <div className="flex flex-col items-start gap-2">
          <div className="text-xs font-medium uppercase text-primary">Endpoint</div>
          {isEditing ? (
            <div className="flex w-full items-center gap-1">
              <input
                type="text"
                value={endpointValue}
                onChange={(e) => setEndpointValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveEndpoint()
                  if (e.key === 'Escape') handleCancelEdit()
                }}
                className="flex h-9 w-full items-center text-ellipsis rounded-xl border border-primary/15 bg-accent p-3 text-xs font-medium text-muted"
                autoFocus
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSaveEndpoint}
                className="hover:cursor-pointer hover:bg-transparent"
              >
                <Icon type="save" size="xs" />
              </Button>
            </div>
          ) : (
            <div className="flex w-full items-center gap-1">
              <motion.div
                className="relative flex h-9 w-full cursor-pointer items-center justify-between rounded-xl border border-primary/15 bg-accent p-3 uppercase"
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
                onClick={() => setIsEditing(true)}
                transition={{ type: 'spring', stiffness: 400, damping: 10 }}
              >
                <AnimatePresence mode="wait">
                  {isHovering ? (
                    <motion.div
                      key="endpoint-display-hover"
                      className="absolute inset-0 flex items-center justify-center"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <p className="flex items-center gap-2 whitespace-nowrap text-xs font-medium text-primary">
                        <Icon type="edit" size="xxs" /> EDIT ENDPOINT
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="endpoint-display"
                      className="absolute inset-0 flex items-center justify-between px-3"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <p className="text-xs font-medium text-muted">
                        {truncateText(selectedEndpoint, 21) || 'NO ENDPOINT ADDED'}
                      </p>
                      <div className={`size-2 shrink-0 rounded-full ${isEndpointActive ? 'bg-positive' : 'bg-destructive'}`} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRefresh}
                className="hover:cursor-pointer hover:bg-transparent"
              >
                <motion.div
                  key={isRotating ? 'rotating' : 'idle'}
                  animate={{ rotate: isRotating ? 360 : 0 }}
                  transition={{ duration: 0.5, ease: 'easeInOut' }}
                >
                  <Icon type="refresh" size="xs" />
                </motion.div>
              </Button>
            </div>
          )}
        </div>

        {/* Mode & Entity Selection */}
        {isEndpointActive && (
          <motion.div
            className="flex w-full flex-col items-start gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          >
            <div className="text-xs font-medium uppercase text-primary">Mode</div>
            
            {/* Mode Selector */}
            <Select value={mode} onValueChange={(value) => handleModeChange(value as Mode)}>
              <SelectTrigger className="h-9 w-full rounded-xl border border-primary/15 bg-primaryAccent text-xs font-medium uppercase">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-none bg-primaryAccent font-dmmono shadow-lg">
                <SelectItem value="agent" className="cursor-pointer">
                  <div className="text-xs font-medium uppercase">Agent</div>
                </SelectItem>
                <SelectItem value="team" className="cursor-pointer">
                  <div className="text-xs font-medium uppercase">Team</div>
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Entity Selector */}
            <Select value={currentValue} onValueChange={handleEntityChange}>
              <SelectTrigger className="h-9 w-full rounded-xl border border-primary/15 bg-primaryAccent text-xs font-medium uppercase">
                <SelectValue placeholder={mode === 'team' ? 'Select Team' : 'Select Agent'} />
              </SelectTrigger>
              <SelectContent className="border-none bg-primaryAccent font-dmmono shadow-lg">
                {currentEntities.map((entity, index) => (
                  <SelectItem
                    className="cursor-pointer"
                    key={`${entity.value}-${index}`}
                    value={entity.value}
                  >
                    <div className="flex items-center gap-3 text-xs font-medium uppercase">
                      <Icon type="user" size="xs" />
                      {entity.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Model Display */}
            {selectedModel && (
              <div className="flex h-9 w-full items-center gap-3 rounded-xl border border-primary/15 bg-accent p-3 text-xs font-medium uppercase text-muted">
                {(() => {
                  const icon = getProviderIcon(selectedModel)
                  return icon ? <Icon type={icon} className="shrink-0" size="xs" /> : null
                })()}
                {selectedModel}
              </div>
            )}
          </motion.div>
        )}

        {/* Sessions */}
        <div className="w-full">
          <div className="mb-2 w-full text-xs font-medium uppercase">Sessions</div>
          <div className="h-[calc(100vh-345px)] overflow-y-auto font-geist">
            {!isEndpointActive || !hasStorage || sessions.length === 0 ? (
              <SessionBlankState hasStorage={hasStorage} />
            ) : isSessionsLoading ? (
              <div className="flex flex-col gap-2">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={index} className="h-11 w-full rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-y-1 pr-1">
                {sessions.map((session) => (
                  <SessionItem
                    key={session.session_id}
                    session={session}
                    isSelected={selectedSessionId === session.session_id}
                    onSelect={() => handleSessionSelect(session.session_id)}
                    onDelete={() => handleSessionDelete(session.session_id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.aside>
  )

  return (
    <div className="flex h-screen bg-background/80">
      <Sidebar />
      <ChatArea />
    </div>
  )
}