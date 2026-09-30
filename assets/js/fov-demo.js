import { S02_SPEC } from "./product-specs.js";
import { createFovFrustum } from "./fov-geometry.js";
import { projectTrackballPoint } from "./trackball.js";

const MAX_DISTANCE = S02_SPEC.lidar.rangeM.max;
const CALIBRATED_REFERENCE_DISTANCE = S02_SPEC.lidar.rangeM.indoorAtReflectance10Percent;
const INITIAL_ROTATION = quaternionFromEuler(-0.31, 0.48, -0.05);
const KEYBOARD_ROTATION_STEP = 0.08;

function quaternionFromEuler(pitch, yaw, roll) {
  const cy = Math.cos(yaw / 2);
  const sy = Math.sin(yaw / 2);
  const cp = Math.cos(pitch / 2);
  const sp = Math.sin(pitch / 2);
  const cr = Math.cos(roll / 2);
  const sr = Math.sin(roll / 2);

  return normalizeQuaternion([
    cr * cp * cy + sr * sp * sy,
    sr * cp * cy - cr * sp * sy,
    cr * sp * cy + sr * cp * sy,
    cr * cp * sy - sr * sp * cy
  ]);
}

function normalizeQuaternion(quaternion) {
  const length = Math.hypot(...quaternion);
  return quaternion.map((value) => value / length);
}

function multiplyQuaternions(left, right) {
  const [aw, ax, ay, az] = left;
  const [bw, bx, by, bz] = right;
  return normalizeQuaternion([
    aw * bw - ax * bx - ay * by - az * bz,
    aw * bx + ax * bw + ay * bz - az * by,
    aw * by - ax * bz + ay * bw + az * bx,
    aw * bz + ax * by - ay * bx + az * bw
  ]);
}

function rotateVector([x, y, z], [w, qx, qy, qz]) {
  const tx = 2 * (qy * z - qz * y);
  const ty = 2 * (qz * x - qx * z);
  const tz = 2 * (qx * y - qy * x);
  return [
    x + w * tx + qy * tz - qz * ty,
    y + w * ty + qz * tx - qx * tz,
    z + w * tz + qx * ty - qy * tx
  ];
}

function trackballPoint(event, rect) {
  const radius = Math.max(1, Math.min(rect.width, rect.height) * 0.56);
  const x = (event.clientX - rect.left - rect.width / 2) / radius;
  const y = (rect.top + rect.height / 2 - event.clientY) / radius;
  return projectTrackballPoint(x, y);
}

function rotationBetween(start, end) {
  const cross = [
    start[1] * end[2] - start[2] * end[1],
    start[2] * end[0] - start[0] * end[2],
    start[0] * end[1] - start[1] * end[0]
  ];
  const dot = Math.max(-1, Math.min(1, start[0] * end[0] + start[1] * end[1] + start[2] * end[2]));

  if (dot < -0.999999) {
    const fallback = Math.abs(start[0]) < 0.8 ? [1, 0, 0] : [0, 1, 0];
    const axis = normalizeVector([
      start[1] * fallback[2] - start[2] * fallback[1],
      start[2] * fallback[0] - start[0] * fallback[2],
      start[0] * fallback[1] - start[1] * fallback[0]
    ]);
    return [0, ...axis];
  }

  return normalizeQuaternion([1 + dot, ...cross]);
}

function normalizeVector(vector) {
  const length = Math.hypot(...vector) || 1;
  return vector.map((value) => value / length);
}

function formatDistance(distance) {
  return distance === CALIBRATED_REFERENCE_DISTANCE
    ? `${distance} m @ 10% indoor`
    : `${distance} m / 示意`;
}

function setupFovDemo(root) {
  const canvas = root.querySelector(".fov-canvas");
  const distanceInput = root.querySelector("[data-fov-distance]");
  const distanceLabel = root.querySelector("[data-fov-distance-label]");
  const resetButton = root.querySelector("[data-fov-reset]");
  const context = canvas?.getContext("2d");

  if (!canvas || !distanceInput || !distanceLabel || !resetButton || !context) return;

  const defaultDistance = Number(distanceInput.value) || CALIBRATED_REFERENCE_DISTANCE;
  distanceInput.max = String(MAX_DISTANCE);
  distanceInput.value = String(Math.min(defaultDistance, MAX_DISTANCE));

  let rotation = [...INITIAL_ROTATION];
  let activePointer = null;
  let previousTrackballPoint = null;
  let canvasWidth = 0;
  let canvasHeight = 0;

  const draw = () => {
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    const targetWidth = Math.round(rect.width * pixelRatio);
    const targetHeight = Math.round(rect.height * pixelRatio);
    if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
      canvas.width = targetWidth;
      canvas.height = targetHeight;
    }

    canvasWidth = rect.width;
    canvasHeight = rect.height;
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    context.clearRect(0, 0, canvasWidth, canvasHeight);
    context.lineCap = "round";
    context.lineJoin = "round";

    const distance = Math.max(1, Math.min(Number(distanceInput.value) || defaultDistance, MAX_DISTANCE));
    const nearMeters = Math.min(1, distance * 0.16);
    const { vertices, segments } = createFovFrustum({
      horizontalDeg: S02_SPEC.lidar.fovDeg[0],
      verticalDeg: S02_SPEC.lidar.fovDeg[1],
      nearMeters,
      farMeters: distance
    });
    const normalizedVertices = vertices.map(([x, y, z]) => rotateVector(
      [x / distance, y / distance, z / distance],
      rotation
    ));
    const cameraDistance = 2.85;
    const projected = normalizedVertices.map(([x, y, z]) => {
      const depth = Math.max(0.35, cameraDistance - z);
      return { x: x / depth, y: -y / depth, z, depth };
    });

    const maxX = Math.max(...projected.map(({ x }) => Math.abs(x)), 0.01);
    const maxY = Math.max(...projected.map(({ y }) => Math.abs(y)), 0.01);
    const scale = Math.max(1, Math.min(
      (canvasWidth - 70) / (2 * maxX),
      (canvasHeight - 82) / (2 * maxY)
    ));
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2 + 5;
    const screenPoints = projected.map(({ x, y, z, depth }) => ({
      x: centerX + x * scale,
      y: centerY + y * scale,
      z,
      depth
    }));

    const faces = [
      { indices: [0, 1, 5, 4], fill: "rgba(71, 185, 196, .08)" },
      { indices: [1, 2, 6, 5], fill: "rgba(60, 150, 216, .09)" },
      { indices: [2, 3, 7, 6], fill: "rgba(99, 220, 179, .07)" },
      { indices: [3, 0, 4, 7], fill: "rgba(86, 187, 210, .07)" },
      { indices: [4, 5, 6, 7], fill: "rgba(107, 177, 225, .08)" }
    ].sort((left, right) => {
      const averageDepth = (face) => face.indices.reduce((sum, index) => sum + screenPoints[index].depth, 0) / face.indices.length;
      return averageDepth(right) - averageDepth(left);
    });

    for (const face of faces) {
      context.beginPath();
      face.indices.forEach((index, position) => {
        const point = screenPoints[index];
        if (position === 0) context.moveTo(point.x, point.y);
        else context.lineTo(point.x, point.y);
      });
      context.closePath();
      context.fillStyle = face.fill;
      context.fill();
    }

    for (let index = 0; index < segments.length; index += 1) {
      const [startIndex, endIndex] = segments[index];
      const start = screenPoints[startIndex];
      const end = screenPoints[endIndex];
      context.beginPath();
      context.moveTo(start.x, start.y);
      context.lineTo(end.x, end.y);
      context.strokeStyle = index < 4
        ? "rgba(167, 245, 213, .9)"
        : index < 8
          ? "rgba(117, 174, 236, .88)"
          : "rgba(88, 218, 210, .66)";
      context.lineWidth = index < 8 ? 1.35 : 1.15;
      context.setLineDash(index >= 8 ? [4, 5] : []);
      context.stroke();
    }
    context.setLineDash([]);

    const origin = rotateVector([0, 0, 0], rotation);
    const originDepth = Math.max(0.35, cameraDistance - origin[2]);
    const originPoint = { x: centerX + origin[0] / originDepth * scale, y: centerY - origin[1] / originDepth * scale };
    context.beginPath();
    context.arc(originPoint.x, originPoint.y, 4, 0, Math.PI * 2);
    context.fillStyle = "#d0ffe9";
    context.fill();
    context.beginPath();
    context.arc(originPoint.x, originPoint.y, 9, 0, Math.PI * 2);
    context.strokeStyle = "rgba(102, 228, 218, .52)";
    context.lineWidth = 1;
    context.stroke();

    context.font = "10px Inter, 'Microsoft YaHei', sans-serif";
    context.fillStyle = "rgba(175, 205, 210, .9)";
    context.fillText(`H-FOV  ${S02_SPEC.lidar.fovDeg[0]}°`, 17, canvasHeight - 31);
    context.fillText(`V-FOV  ${S02_SPEC.lidar.fovDeg[1]}°`, 17, canvasHeight - 15);
    context.textAlign = "right";
    context.fillStyle = "rgba(128, 175, 188, .88)";
    context.fillText(`${distance} m`, canvasWidth - 17, canvasHeight - 17);
    context.textAlign = "left";

    distanceLabel.textContent = formatDistance(distance);
  };

  canvas.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    activePointer = event.pointerId;
    previousTrackballPoint = trackballPoint(event, canvas.getBoundingClientRect());
    canvas.classList.add("is-dragging");
    canvas.setPointerCapture(event.pointerId);
  });

  canvas.addEventListener("keydown", (event) => {
    const rotationByKey = {
      ArrowLeft: [0, -KEYBOARD_ROTATION_STEP, 0],
      ArrowRight: [0, KEYBOARD_ROTATION_STEP, 0],
      ArrowUp: [-KEYBOARD_ROTATION_STEP, 0, 0],
      ArrowDown: [KEYBOARD_ROTATION_STEP, 0, 0]
    }[event.key];

    if (!rotationByKey) return;
    event.preventDefault();
    rotation = multiplyQuaternions(quaternionFromEuler(...rotationByKey), rotation);
    draw();
  });

  canvas.addEventListener("pointermove", (event) => {
    if (event.pointerId !== activePointer || !previousTrackballPoint) return;
    event.preventDefault();
    const nextPoint = trackballPoint(event, canvas.getBoundingClientRect());
    rotation = multiplyQuaternions(rotationBetween(previousTrackballPoint, nextPoint), rotation);
    previousTrackballPoint = nextPoint;
    draw();
  });

  const stopDragging = (event) => {
    if (event.pointerId !== activePointer) return;
    activePointer = null;
    previousTrackballPoint = null;
    canvas.classList.remove("is-dragging");
  };
  canvas.addEventListener("pointerup", stopDragging);
  canvas.addEventListener("pointercancel", stopDragging);
  canvas.addEventListener("lostpointercapture", stopDragging);

  distanceInput.addEventListener("input", draw);
  resetButton.addEventListener("click", () => {
    rotation = [...INITIAL_ROTATION];
    distanceInput.value = String(defaultDistance);
    draw();
    distanceInput.focus({ preventScroll: true });
  });

  if ("ResizeObserver" in window) {
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
  } else {
    window.addEventListener("resize", draw, { passive: true });
  }
  draw();
}

for (const demo of document.querySelectorAll("[data-fov-demo]")) {
  setupFovDemo(demo);
}

