// features/streaming/state/schema.js

export const ACTIONS = {
  ROUTE_SET: "route/set",
  ROUTE_PATCH: "route/patch",

  CONNECTION_SET: "connection/set",

  TURN_PHASE_SET: "turn/phase/set",

  SESSION_SET: "session/set",
  SESSION_TICK: "session/tick",
  SESSION_RESET: "session/reset",
  SESSION_TURN_INC: "session/turn/inc",
  SESSION_END: "session/end",
  SESSION_MODAL_SET: "session/modal/set",

  THREAD_ADD_TURN: "thread/add",
  THREAD_PATCH_TURN: "thread/patch",
  THREAD_CLEAR: "thread/clear",
};

export function createInitialState({ route }) {
  return {
    route,

    scenario: route?.scenario || null,

    connection: {
      status: "disconnected", // disconnected | connecting | live | error
      error: null,
    },

    turn: {
      phase: "idle", // idle | recording | sending | playing
      activeTurnId: null,
    },

    thread: {
      turns: [],
    },

    session: {
      durationSec: Number(route?.durationSec || 300),
      remainingSec: Number(route?.durationSec || 300),
      turnCap: Number(route?.turnCap || 10), // default for 5:00
      turnsUsed: 0,
      running: false,
      ended: false,
      endReason: null, // "timer" | "turn_cap" | "manual"
      modalOpen: false,
    },
  };
}

export function reducer(state, action) {
  const a = action || {};
  switch (a.type) {
    case ACTIONS.ROUTE_SET: {
      const route = a.route || state.route;
      return { ...state, route, scenario: route?.scenario || state.scenario };
    }

    case ACTIONS.ROUTE_PATCH: {
      const patch = a.patch || {};
      const route = { ...(state.route || {}), ...patch };
      return { ...state, route, scenario: route?.scenario || state.scenario };
    }

    case ACTIONS.CONNECTION_SET: {
      const next = a.connection || {};
      return {
        ...state,
        connection: {
          ...state.connection,
          ...next,
        },
      };
    }

    case ACTIONS.TURN_PHASE_SET: {
      return {
        ...state,
        turn: {
          ...state.turn,
          ...((a.turn || {})),
        },
      };
    }

    case ACTIONS.THREAD_ADD_TURN: {
      const t = a.turn;
      if (!t) return state;
      return {
        ...state,
        thread: { ...state.thread, turns: [...state.thread.turns, t] },
      };
    }

    case ACTIONS.THREAD_PATCH_TURN: {
      const { id, patch } = a;
      if (!id || !patch) return state;
      const turns = state.thread.turns.map((t) =>
        t.id === id ? { ...t, ...patch } : t
      );
      return { ...state, thread: { ...state.thread, turns } };
    }

    case ACTIONS.THREAD_CLEAR: {
      return { ...state, thread: { ...state.thread, turns: [] } };
    }

    case ACTIONS.SESSION_SET: {
      return { ...state, session: { ...state.session, ...(a.session || {}) } };
    }

    case ACTIONS.SESSION_TICK: {
      const remainingSec = Number(a.remainingSec);
      if (!Number.isFinite(remainingSec)) return state;
      return { ...state, session: { ...state.session, remainingSec } };
    }

    case ACTIONS.SESSION_RESET: {
      const dur = state.session?.durationSec || 300;
      return {
        ...state,
        session: {
          ...state.session,
          remainingSec: dur,
          running: false,
          ended: false,
          endReason: null,
          modalOpen: false,
          turnsUsed: 0, // optional but usually what you want on reset
        },
      };
    }

    case ACTIONS.SESSION_TURN_INC: {
      const next = (state.session.turnsUsed || 0) + 1;
      const ended = next >= (state.session.turnCap || 999999);
      return {
        ...state,
        session: {
          ...state.session,
          turnsUsed: next,
          ...(ended
            ? {
                ended: true,
                running: false,
                endReason: "turn_cap",
                modalOpen: true,
              }
            : {}),
        },
      };
    }

    case ACTIONS.SESSION_END: {
      return {
        ...state,
        session: {
          ...state.session,
          running: false,
          ended: true,
          endReason: a.reason || state.session.endReason || "manual",
          modalOpen: true,
        },
      };
    }

    case ACTIONS.SESSION_MODAL_SET: {
      return { ...state, session: { ...state.session, modalOpen: !!a.open } };
    }

    default:
      return state;
  }
}
