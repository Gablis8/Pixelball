// ============================================================
//  Saha geometrisi — hem istemci hem sunucu kullanır.
// ============================================================

import { RESOLUTION, GOAL } from './constants.js';

// Oynanabilir saha sınırları. Kenarlarda kale ağı için yeterli boşluk var.
export const FIELD = {
  x: 10,
  y: 8,
  w: RESOLUTION.width - 20, // 300
  h: RESOLUTION.height - 16, // 164
};

export const FIELD_CENTER = {
  x: FIELD.x + FIELD.w / 2, // 160
  y: FIELD.y + FIELD.h / 2, // 90
};

export const GOAL_HALF = GOAL.height / 2;

// Verilen y, kale ağzının içinde mi?
export function isInGoalMouth(y) {
  return Math.abs(y - FIELD_CENTER.y) <= GOAL_HALF;
}
