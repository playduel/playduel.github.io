import { Rng } from "../../core/rng";

/** Short, plain sentences: no rare punctuation, so phone keyboards are fine. */
const SENTENCES = [
  "the quick fox jumped over a sleepy dog",
  "pack my bag with five dozen jars of jam",
  "a good plan today beats a perfect plan next week",
  "we ran to the bus stop just as it pulled away",
  "she kept the old map in a box under the bed",
  "the rain stopped and the street began to shine",
  "bring a coat because the wind is cold tonight",
  "my phone died right before the final round",
  "the cat sat on the warm hood of the car",
  "every great game starts with a simple rule",
  "he typed so fast the keyboard started to smoke",
  "turn left at the light and park by the gate",
  "the team won the match in the last minute",
  "fresh bread smells best on a quiet morning",
  "keep calm and press the right key at the right time",
  "the lights went out just as the movie began",
  "a small boat drifted past the silent harbor",
  "she found a coin under the couch cushion",
  "the old clock in the hall ticks a little too loud",
  "we climbed the hill to watch the sun go down",
  "my friend still owes me five bucks from lunch",
  "the robot waved at the crowd and took a bow",
  "never trust a pizza that has no cheese on it",
  "the train was late so we played cards on the floor",
];

export interface TypingPuzzle { text: string }

/** Three sentences joined: around 25 to 30 words. */
export function createTypingPuzzle(seed: number): TypingPuzzle {
  const rng = new Rng(seed);
  return { text: rng.shuffle(SENTENCES).slice(0, 3).join(" ") };
}

/**
 * Words per minute (a "word" = 5 characters), scaled by accuracy, so
 * mashing keys doesn't pay. Score is rounded to a whole number.
 */
export function typingScore(correctChars: number, mistakes: number, elapsedMs: number): number {
  if (correctChars === 0 || elapsedMs <= 0) return 0;
  const wpm = correctChars / 5 / (elapsedMs / 60_000);
  const accuracy = correctChars / (correctChars + mistakes);
  return Math.round(wpm * accuracy);
}
