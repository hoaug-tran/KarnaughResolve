import type { LedPolarity } from '../types'

export type SegmentName = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g'

export const SEGMENT_MAP: Record<string, SegmentName[]> = {
  '0': ['a', 'b', 'c', 'd', 'e', 'f'],
  '1': ['b', 'c'],
  '2': ['a', 'b', 'd', 'e', 'g'],
  '3': ['a', 'b', 'c', 'd', 'g'],
  '4': ['b', 'c', 'f', 'g'],
  '5': ['a', 'c', 'd', 'f', 'g'],
  '6': ['a', 'c', 'd', 'e', 'f', 'g'],
  '7': ['a', 'b', 'c'],
  '8': ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
  '9': ['a', 'b', 'c', 'd', 'f', 'g'],
  'A': ['a', 'b', 'c', 'e', 'f', 'g'],
  'a': ['a', 'b', 'c', 'd', 'e', 'g'],
  'B': ['c', 'd', 'e', 'f', 'g'],
  'b': ['c', 'd', 'e', 'f', 'g'],
  'C': ['a', 'd', 'e', 'f'],
  'c': ['d', 'e', 'g'],
  'D': ['b', 'c', 'd', 'e', 'g'],
  'd': ['b', 'c', 'd', 'e', 'g'],
  'E': ['a', 'd', 'e', 'f', 'g'],
  'e': ['a', 'b', 'd', 'e', 'f', 'g'],
  'F': ['a', 'e', 'f', 'g'],
  'H': ['b', 'c', 'e', 'f', 'g'],
  'h': ['c', 'e', 'f', 'g'],
  'I': ['b', 'c'],
  'i': ['c'],
  'J': ['b', 'c', 'd'],
  'L': ['d', 'e', 'f'],
  'P': ['a', 'b', 'e', 'f', 'g'],
  'U': ['b', 'c', 'd', 'e', 'f'],
  'u': ['c', 'd', 'e'],
  'o': ['c', 'd', 'e', 'g'],
  'O': ['a', 'b', 'c', 'd', 'e', 'f'],
  'n': ['c', 'e', 'g'],
  'r': ['e', 'g'],
  't': ['d', 'e', 'f', 'g'],
  'y': ['b', 'c', 'd', 'f', 'g'],
  '°': ['a', 'b', 'f', 'g'],
  '-': ['g'],
  '=': ['d', 'g'],
  '_': ['d'],
  '"': ['b', 'f'],
  '≡': ['a', 'd', 'g'],
  '[': ['a', 'd', 'e', 'f'],
  ']': ['a', 'b', 'c', 'd']
}

export const DIGIT_CHARS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
export const LETTER_CHARS = ['A', 'b', 'C', 'c', 'd', 'E', 'F', 'H', 'h', 'L', 'P', 'U', 'u', 'o', 'n', 'r', 'J', 't', 'y']
export const SYMBOL_CHARS = ['°', '-', '=', '_', '"', '≡', '[', ']']

export interface SevenSegPreset {
  label: string
  chars: string[]
  segments?: SegmentName[]
  polarity?: LedPolarity
}

export const COMMON_7SEG_PRESETS: SevenSegPreset[] = [
  {
    label: '5, 6, 7, 8, 9, A, E, d, P, H (Đề cương C6: b, c, d)',
    chars: ['5', '6', '7', '8', '9', 'A', 'E', 'd', 'P', 'H'],
    segments: ['b', 'c', 'd'],
    polarity: 'cathode_common'
  },
  {
    label: '4, 5, 6, 7, 8, 9, A, b, C (Bài tập C8: e, f, g - Anot chung)',
    chars: ['4', '5', '6', '7', '8', '9', 'A', 'b', 'C'],
    segments: ['e', 'f', 'g'],
    polarity: 'anode_common'
  },
  {
    label: '1, 2, 3, 4, 5, 6, 7, 8, 9, A (Bài tập C9: a, b, c)',
    chars: ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'A'],
    segments: ['a', 'b', 'c'],
    polarity: 'cathode_common'
  },
  {
    label: '5, 6, 7, 8, 9, A, E, d, P, H (Thanh a, d, g)',
    chars: ['5', '6', '7', '8', '9', 'A', 'E', 'd', 'P', 'H'],
    segments: ['a', 'd', 'g'],
    polarity: 'cathode_common'
  },
  {
    label: '0, 1, 2, 3, 4, 5, 6, 7, 8, 9 (Slide 5)',
    chars: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
    segments: ['a', 'd', 'g'],
    polarity: 'cathode_common'
  }
]

export function getSegmentActives(char: string, customSegments?: SegmentName[]): Record<SegmentName, boolean> {
  const activeList = customSegments ?? SEGMENT_MAP[char] ?? SEGMENT_MAP[char.toUpperCase()] ?? []
  return {
    a: activeList.includes('a'),
    b: activeList.includes('b'),
    c: activeList.includes('c'),
    d: activeList.includes('d'),
    e: activeList.includes('e'),
    f: activeList.includes('f'),
    g: activeList.includes('g')
  }
}

export function getSegmentBitValue(isActive: boolean, polarity: LedPolarity): number {
  if (polarity === 'cathode_common') {
    return isActive ? 1 : 0
  }
  return isActive ? 0 : 1
}

export function parseSevenSegmentBits(
  char: string,
  polarity: LedPolarity,
  customSegments?: SegmentName[]
): Record<SegmentName, number> {
  const actives = getSegmentActives(char, customSegments)
  return {
    a: getSegmentBitValue(actives.a, polarity),
    b: getSegmentBitValue(actives.b, polarity),
    c: getSegmentBitValue(actives.c, polarity),
    d: getSegmentBitValue(actives.d, polarity),
    e: getSegmentBitValue(actives.e, polarity),
    f: getSegmentBitValue(actives.f, polarity),
    g: getSegmentBitValue(actives.g, polarity)
  }
}
