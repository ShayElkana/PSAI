// Region-agnostic on purpose: PSAI doesn't know where its person is located,
// and getting a country-specific hotline wrong would be worse than saying
// nothing. Point at a directory instead of guessing a number.
export const CRISIS_RESOURCE_MESSAGE =
  "If you're in immediate danger or thinking about harming yourself, please " +
  "reach out to a crisis line or emergency services in your country right " +
  "now — you don't have to go through this alone. In the US you can call " +
  "or text 988. Findahelpline.com lists crisis lines for most countries.";
