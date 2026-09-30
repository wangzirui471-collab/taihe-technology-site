function normalizeVector([x, y, z]) {
  const length = Math.hypot(x, y, z) || 1;
  return [x / length, y / length, z / length];
}

export function projectTrackballPoint(x, y) {
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    throw new RangeError("Trackball coordinates must be finite.");
  }

  const distance = Math.hypot(x, y);
  if (!Number.isFinite(distance)) {
    throw new RangeError("Trackball distance must be finite.");
  }
  if (distance <= Math.SQRT1_2) {
    return [x, y, Math.sqrt(1 - distance * distance)];
  }

  return normalizeVector([x, y, 0.5 / distance]);
}

