import { PERSISTENCE_EVENTS } from '#shared/adapters/persistence/session/persistence-events';
import { isRecord } from '#shared/lib/is-record';

export const createPersistenceChannel = (onInvalidation: () => void) => {
  if (typeof BroadcastChannel === 'undefined') {
    return { broadcast: (_type: string): void => undefined };
  }

  const channel = new BroadcastChannel(PERSISTENCE_EVENTS.channelName);
  channel.addEventListener('message', (event: MessageEvent<unknown>) => {
    if (!isRecord(event.data) || typeof event.data.type !== 'string') {
      return;
    }
    if (
      !PERSISTENCE_EVENTS.invalidatingMessageTypes.includes(event.data.type)
    ) {
      return;
    }
    onInvalidation();
  });

  return {
    broadcast: (type: string): void => {
      channel.postMessage({ type });
    },
  };
};
