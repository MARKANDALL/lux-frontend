// api/identity.js
export function getUID() {
  return (
    globalThis.LUX_USER_ID ||
    (typeof localStorage !== "undefined" &&
      localStorage.getItem("LUX_USER_ID")) ||
    null
  );
}
