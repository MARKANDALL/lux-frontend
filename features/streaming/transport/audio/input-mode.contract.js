// features/streaming/audio/input-mode.contract.js
/**
 * InputMode Contract
 *
 * start()  -> wires listeners; prepares for capture
 * stop()   -> unwires listeners; stops active capture if needed
 *
 * Callbacks:
 * - onUtterance(blob, meta): fires once per turn boundary
 * - onState(phase): "idle" | "recording"
 * - onError(err)
 */
export const INPUT_MODE_CONTRACT = true;
