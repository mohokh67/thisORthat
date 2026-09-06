import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from './supabase'

export interface PresenceParticipant {
  id: string
  name: string
}

interface PresenceMeta {
  name: string
}

type SyncListener = (participants: PresenceParticipant[]) => void

interface Entry {
  channel: RealtimeChannel
  listeners: Set<SyncListener>
  /** Currently tracked display name; updated when a subscriber renames. */
  name: string
  stopVisibility: () => void
  teardown?: ReturnType<typeof setTimeout>
}

// One shared channel per board topic. Presence only works if every viewer joins
// the *same* topic, so it can't carry a random suffix like the data channel; a
// short debounced teardown instead absorbs the unsubscribe/resubscribe churn of
// StrictMode and quick same-board navigation.
const entries = new Map<string, Entry>()

function read(channel: RealtimeChannel): PresenceParticipant[] {
  const state = channel.presenceState<PresenceMeta>()
  return Object.entries(state).map(([id, metas]) => ({ id, name: metas[0]?.name ?? '?' }))
}

/**
 * Tracks this participant in a board's Realtime Presence channel and reports the
 * current set of viewers. Only a focused tab stays tracked, so a backgrounded
 * tab drops out. Returns an unsubscribe function.
 */
export function subscribeToPresence(
  boardId: string,
  identity: PresenceParticipant,
  onSync: SyncListener,
): () => void {
  const topic = `presence:${boardId}`
  let entry = entries.get(topic)

  if (entry) {
    if (entry.teardown) {
      clearTimeout(entry.teardown)
      entry.teardown = undefined
    }
    if (entry.name !== identity.name) {
      entry.name = identity.name
      if (document.visibilityState === 'visible') {
        void entry.channel.track({ name: identity.name })
      }
    }
  } else {
    const channel = supabase.channel(topic, {
      config: { presence: { key: identity.id } },
    })
    const created: Entry = {
      channel,
      listeners: new Set(),
      name: identity.name,
      stopVisibility: () => {},
    }
    entries.set(topic, created)
    entry = created

    const emit = (): void => {
      const participants = read(channel)
      for (const listener of created.listeners) {
        listener(participants)
      }
    }
    const sync = (): void => {
      if (document.visibilityState === 'visible') {
        void channel.track({ name: created.name })
      } else {
        void channel.untrack()
      }
    }

    channel.on('presence', { event: 'sync' }, emit)
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        sync()
        // The first `sync` event can land before other viewers have propagated;
        // re-read shortly after so the strip fills in.
        setTimeout(emit, 1000)
      }
    })
    document.addEventListener('visibilitychange', sync)
    created.stopVisibility = () => document.removeEventListener('visibilitychange', sync)
  }

  entry.listeners.add(onSync)
  onSync(read(entry.channel))

  return () => {
    const current = entries.get(topic)
    if (!current) {
      return
    }
    current.listeners.delete(onSync)
    if (current.listeners.size === 0) {
      current.teardown = setTimeout(() => {
        if (current.listeners.size === 0) {
          current.stopVisibility()
          void supabase.removeChannel(current.channel)
          entries.delete(topic)
        }
      }, 150)
    }
  }
}
