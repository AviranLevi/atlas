// External
import { EventEmitter } from 'node:events';

/**
 * App-wide change events. Invalidation-only by design: an event carries the
 * affected entity *kind* (and optionally an id), never a data payload. The
 * client reacts by invalidating the matching React Query cache key and
 * refetching through the normal authed REST path — so the SSE channel leaks
 * nothing sensitive and there is no second source of truth to keep in sync.
 */
export type AppEventKind = 'workspace' | 'task' | 'review' | 'pipeline';

export interface AppEvent {
  kind: AppEventKind;
  /** Affected entity id, when known. Clients may use it for targeted invalidation. */
  id?: string;
}

const CHANNEL = 'app-event';

/**
 * A tiny in-process pub/sub for change notifications. Lives in `lib/` (no
 * service/repo dependencies) so repositories can publish to it the same way
 * they already use the logger — without creating a layering cycle.
 */
class EventBus {
  private readonly emitter = new EventEmitter();

  constructor() {
    // One listener per connected SSE client; bump the ceiling so a handful of
    // browser tabs don't trip Node's default 10-listener leak warning.
    this.emitter.setMaxListeners(100);
  }

  /** Publishes a change event. No-op cost when nobody is subscribed. */
  publish(event: AppEvent): void {
    this.emitter.emit(CHANNEL, event);
  }

  /** Subscribes to all events. Returns an unsubscribe function. */
  subscribe(listener: (event: AppEvent) => void): () => void {
    this.emitter.on(CHANNEL, listener);
    return () => this.emitter.off(CHANNEL, listener);
  }
}

export const eventBus = new EventBus();
