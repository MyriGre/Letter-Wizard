// Optional typing shim so the server-side code can dynamically import "openai" if the dependency is installed.
// This app works without it; AI draft endpoint falls back to heuristic generation.
declare module 'openai' {
  const OpenAI: any;
  export default OpenAI;
}

