import { FormEvent } from 'react'
import { Megaphone, Send } from 'lucide-react'
import { maxMessageLength } from '../lib/constants'
import { Button, FieldLabel, Panel, PanelHeader, TextAreaField, TextField } from './ui'

type ComposerPanelProps = {
  message: string
  tags: string
  intensity: number
  busy: boolean
  onMessageChange: (value: string) => void
  onTagsChange: (value: string) => void
  onIntensityChange: (value: number) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export function ComposerPanel({
  message,
  tags,
  intensity,
  busy,
  onMessageChange,
  onTagsChange,
  onIntensityChange,
  onSubmit,
}: ComposerPanelProps) {
  return (
    <Panel>
      <PanelHeader icon={<Megaphone className="size-4" />} title="Publish signal">
        Write the friction as plainly as the agent would report it.
      </PanelHeader>

      <form className="mt-4 grid gap-3" onSubmit={onSubmit}>
        <TextAreaField
          label="Frustration"
          maxLength={maxMessageLength}
          onChange={(event) => onMessageChange(event.currentTarget.value)}
          placeholder="The agent could not finish because..."
          required
          value={message}
        />
        <div className="flex flex-wrap justify-between gap-2 text-xs text-zinc-500">
          <span>{maxMessageLength - message.length} characters left</span>
          <span>Source: web</span>
        </div>
        <TextField
          label="Tags"
          onChange={(event) => onTagsChange(event.currentTarget.value)}
          placeholder="llm, docs, auth"
          value={tags}
        />
        <FieldLabel>
          <span className="flex items-center justify-between gap-3">
            <span>Intensity</span>
            <span className="font-bold text-amber-300">{intensity}/10</span>
          </span>
          <input
            className="w-full accent-amber-300"
            max={10}
            min={1}
            onChange={(event) => onIntensityChange(Number(event.currentTarget.value))}
            type="range"
            value={intensity}
          />
        </FieldLabel>
        <Button
          className="mt-1 w-full"
          leftIcon={<Send className="size-4" />}
          loading={busy}
          type="submit"
          variant="primary"
        >
          Publish
        </Button>
      </form>
    </Panel>
  )
}
