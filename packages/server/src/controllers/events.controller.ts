// External
import type { Context } from 'hono';
import { streamSSE } from 'hono/streaming';

// Lib
import { type AppEvent, eventBus } from '../lib/event-bus.js';

/**
 * Streams app-wide change events to the client over SSE. Invalidation-only:
 * each message is `{ kind, id? }` with no data payload (see event-bus.ts).
 *
 * The client opens this once and invalidates React Query caches on each event,
 * replacing most of the per-resource polling. EventSource auto-reconnects, so
 * a dropped connection self-heals; the periodic `ping` keeps proxies from
 * closing an idle stream.
 */
export async function streamEvents(c: Context) {
  return streamSSE(c, async (stream) => {
    let aborted = false;
    stream.onAbort(() => {
      aborted = true;
    });

    // Buffer events from the (sync) bus listener and drain them in the async
    // write loop — stream.writeSSE is async and can't run inside the listener.
    const queue: AppEvent[] = [];
    const unsubscribe = eventBus.subscribe((event) => queue.push(event));

    const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

    try {
      let ticks = 0;
      while (!aborted) {
        while (queue.length > 0 && !aborted) {
          const event = queue.shift()!;
          await stream.writeSSE({ event: event.kind, data: JSON.stringify(event) });
        }

        // Heartbeat every ~15s (60 ticks of 250ms) to keep the stream alive.
        ticks++;
        if (ticks % 60 === 0) {
          await stream.writeSSE({ event: 'ping', data: '' });
        }

        await sleep(250);
      }
    } finally {
      unsubscribe();
    }
  });
}
