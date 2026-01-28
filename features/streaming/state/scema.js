// features/streaming/state/schema.js

export const ACTIONS = {
  ROUTE_SET: "route/set",

  CONNECTION_SET: "connection/set",

  TURN_PHASE_SET: "turn/phase/set",

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
  };
}

export function reducer(state, action) {
  const a = action || {};
  switch (a.type) {
    case ACTIONS.ROUTE_SET: {
      const route = a.route || state.route;
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

    default:
      return state;
  }
}
