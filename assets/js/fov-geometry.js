const FRUSTUM_SEGMENTS = [
  [0, 1], [1, 2], [2, 3], [3, 0],
  [4, 5], [5, 6], [6, 7], [7, 4],
  [0, 4], [1, 5], [2, 6], [3, 7]
];

function isPositiveFinite(value) {
  return Number.isFinite(value) && value > 0;
}

export function createFovFrustum(options) {
  if (!options || typeof options !== "object" || Array.isArray(options)) {
    throw new RangeError("A field-of-view options object is required.");
  }

  const { horizontalDeg, verticalDeg, nearMeters, farMeters } = options;
  const validAngle = (angle) => Number.isFinite(angle) && angle > 0 && angle < 180;

  if (!validAngle(horizontalDeg) || !validAngle(verticalDeg)) {
    throw new RangeError("Field-of-view angles must be finite and between 0 and 180 degrees.");
  }
  if (!isPositiveFinite(nearMeters) || !isPositiveFinite(farMeters) || nearMeters >= farMeters) {
    throw new RangeError("Distances must be finite, positive, and nearMeters must be less than farMeters.");
  }

  const halfWidth = (distance) => distance * Math.tan((horizontalDeg * Math.PI) / 360);
  const halfHeight = (distance) => distance * Math.tan((verticalDeg * Math.PI) / 360);
  const cornersAt = (distance) => {
    const width = halfWidth(distance);
    const height = halfHeight(distance);
    return [
      [-width, -height, distance],
      [width, -height, distance],
      [width, height, distance],
      [-width, height, distance]
    ];
  };

  const vertices = [...cornersAt(nearMeters), ...cornersAt(farMeters)];
  if (!vertices.flat().every(Number.isFinite)) {
    throw new RangeError("The supplied field-of-view values create non-finite coordinates.");
  }

  return {
    vertices,
    segments: FRUSTUM_SEGMENTS.map(([start, end]) => [start, end])
  };
}

