export const QUIET_SECONDS = 20;
export const PHASE_SECONDS = Object.freeze({ arriving: 5.5, fleeing: 3.4, returning: 5.5 });

/** The clock advances only while the nature scene is visible and enabled. */
export function createNatureState() {
  let clock = 0, phase = 'arriving', enteredAt = 0, lastInteraction = -Infinity, revision = 0;
  function enter(next) { phase = next; enteredAt = clock; revision++; }
  return {
    interact() {
      lastInteraction = clock;
      if (phase !== 'fleeing' && phase !== 'hidden') enter('fleeing');
    },
    update(delta, blocked = false) {
      clock += Math.max(0, delta);
      if (blocked) lastInteraction = clock;
      const elapsed = clock - enteredAt;
      if ((phase === 'arriving' || phase === 'returning') && elapsed >= PHASE_SECONDS[phase]) enter('calm');
      else if (phase === 'fleeing' && elapsed >= PHASE_SECONDS.fleeing) enter('hidden');
      else if (phase === 'hidden' && !blocked && clock - lastInteraction >= QUIET_SECONDS) enter('returning');
    },
    settle() { enter('calm'); },
    getState() {
      return {
        phase, clock, elapsed: clock - enteredAt, revision,
        quietRemaining: Number.isFinite(lastInteraction) ? Math.max(0, QUIET_SECONDS - (clock - lastInteraction)) : 0
      };
    }
  };
}
