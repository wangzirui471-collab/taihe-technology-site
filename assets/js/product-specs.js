const interfaceConfigurations = [
  { label: "1× Gigabit Ethernet", status: "standard" },
  { label: "Dual Gigabit Ethernet", status: "custom" },
  { label: "CAN", status: "reserved" },
  { label: "NPN input ×2", status: "reserved" },
  { label: "NPN output ×2", status: "reserved" }
];

export const S02_SPEC = {
  lidar: {
    technology: "dToF",
    resolutionPx: [256, 192],
    fovDeg: [120, 90],
    angularResolutionDeg: 0.5,
    wavelengthNm: { center: 940, tolerance: 15 },
    laserClass: "1",
    rangeM: { min: 0.5, max: 70, indoorAtReflectance10Percent: 30 },
    accuracyText: "±30 mm @ 1σ",
    frameRateFps: 10
  },
  rgb: {
    megapixels: 5,
    hdr: true,
    shutter: "electronic rolling",
    fovDeg: [120, 90]
  },
  imu: { axes: 6 },
  output: ["LiDAR point cloud", "RGB", "IMU"],
  software: "Linux/ROS SDK for RGB-D",
  interfaces: {
    standard: ["1× Gigabit Ethernet"],
    custom: ["Dual Gigabit Ethernet"],
    reserved: ["CAN", "NPN input ×2", "NPN output ×2"],
    configurations: interfaceConfigurations
  },
  electrical: {
    inputVoltageV: [14, 30],
    recommendedVoltageV: 24,
    steadyStatePowerMaxW: 10
  },
  environment: {
    workingTemperatureC: [-20, 65],
    storageTemperatureC: [-25, 75],
    ambientLightLux: 80000,
    standardProtection: "IP65",
    customProtection: "IP67",
    cooling: "natural"
  },
  mechanical: {
    dimensionsText: "118 × 52 × 63 mm",
    weightMaxG: 700
  }
};

