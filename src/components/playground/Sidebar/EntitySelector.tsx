import * as React from 'react'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@/components/ui/select'
import { usePlaygroundStore } from '@/store'
import Icon from '@/components/ui/icon'
import { useEffect } from 'react'
import useChatActions from '@/hooks/useChatActions'

export default function EntitySelector({ mode, teams, agents, teamId, agentId, setSelectedModel, setHasStorage, setSelectedTeamId, setTeamId, setAgentId, setMessages, setSessionId, focusChatInput }) {
  const currentEntities = mode === 'team' ? teams : agents
  const currentValue = mode === 'team' ? teamId : agentId
  const placeholder = mode === 'team' ? 'Select Team' : 'Select Agent'

  useEffect(() => {
    if (currentValue && currentEntities.length > 0) {
      const entity = currentEntities.find((item) => item.value === currentValue)
      if (entity) {
        setSelectedModel(entity.model.provider || '')
        setHasStorage(!!entity.storage)
        if (mode === 'team') {
          setSelectedTeamId(entity.value)
        }
        if (entity.model.provider) {
          focusChatInput()
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentValue, currentEntities, setSelectedModel, mode])

  const handleOnValueChange = (value: string) => {
    const newValue = value === currentValue ? null : value
    const selectedEntity = currentEntities.find(
      (item) => item.value === newValue
    )

    setSelectedModel(selectedEntity?.model.provider || '')
    setHasStorage(!!selectedEntity?.storage)

    if (mode === 'team') {
      setSelectedTeamId(newValue)
      setTeamId(newValue)
      setAgentId(null)
    } else {
      setSelectedTeamId(null)
      setAgentId(newValue)
      setTeamId(null)
    }

    setMessages([])
    setSessionId(null)

    if (selectedEntity?.model.provider) {
      focusChatInput()
    }
  }

  if (currentEntities.length === 0) {
    return (
      <Select disabled>
        <SelectTrigger className="h-9 w-full rounded-xl border border-primary/15 bg-primaryAccent text-xs font-medium uppercase opacity-50">
          <SelectValue placeholder={`No ${mode}s Available`} />
        </SelectTrigger>
      </Select>
    )
  }

  return (
    <Select
      value={currentValue || ''}
      onValueChange={(value) => handleOnValueChange(value)}
    >
      <SelectTrigger className="h-9 w-full rounded-xl border border-primary/15 bg-primaryAccent text-xs font-medium uppercase">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="border-none bg-primaryAccent font-dmmono shadow-lg">
        {currentEntities.map((entity, index) => (
          <SelectItem
            className="cursor-pointer"
            key={`${entity.value}-${index}`}
            value={entity.value}
          >
            <div className="flex items-center gap-3 text-xs font-medium uppercase">
              <Icon type={'user'} size="xs" />
              {entity.label}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
