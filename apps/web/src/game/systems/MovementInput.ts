export interface MovementInput { x: -1 | 0 | 1; y: -1 | 0 | 1 }
export interface MovementVector { x: number; y: number }

export function movementFromKeys(keys: { up: boolean; down: boolean; left: boolean; right: boolean }): MovementInput {
  return {
    x: keys.left === keys.right ? 0 : keys.left ? -1 : 1,
    y: keys.up === keys.down ? 0 : keys.up ? -1 : 1,
  };
}

export function normalizedMovement(input: MovementInput): MovementVector {
  const length = Math.hypot(input.x, input.y);
  return length === 0 ? { x: 0, y: 0 } : { x: input.x / length, y: input.y / length };
}
