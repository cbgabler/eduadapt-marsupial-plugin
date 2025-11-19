const NUMBER_FORMAT = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 1,
  minimumFractionDigits: 0,
});

export function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

export function formatBloodPressure(reading) {
  if (
    !reading ||
    !isFiniteNumber(reading.systolic) ||
    !isFiniteNumber(reading.diastolic)
  ) {
    return "--";
  }
  return `${Math.round(reading.systolic)}/${Math.round(
    reading.diastolic
  )} mmHg`;
}

export function formatValue(value, suffix = "") {
  if (!isFiniteNumber(value)) {
    return "--";
  }
  const formatted = NUMBER_FORMAT.format(value);
  return suffix ? `${formatted} ${suffix}` : formatted;
}

export function formatTemperature(value, unit = "F") {
  if (!isFiniteNumber(value)) {
    return "--";
  }
  return `${NUMBER_FORMAT.format(value)} deg${unit}`;
}

export function buildVitalSummary(vitals = {}) {
  const summary = [];
  if (vitals.bloodPressure) {
    summary.push({
      label: "Blood Pressure",
      value: formatBloodPressure(vitals.bloodPressure),
    });
  }
  if (isFiniteNumber(vitals.heartRate)) {
    summary.push({
      label: "Heart Rate",
      value: `${formatValue(vitals.heartRate)} bpm`,
    });
  }
  if (isFiniteNumber(vitals.respiratoryRate)) {
    summary.push({
      label: "Respirations",
      value: `${formatValue(vitals.respiratoryRate)} / min`,
    });
  }
  if (isFiniteNumber(vitals.temperature)) {
    summary.push({
      label: "Temperature",
      value: formatTemperature(vitals.temperature, vitals.temperatureUnit),
    });
  }
  if (isFiniteNumber(vitals.oxygenSaturation)) {
    summary.push({
      label: "O2 Saturation",
      value: `${formatValue(vitals.oxygenSaturation)} %`,
    });
  }
  if (isFiniteNumber(vitals.painLevel)) {
    summary.push({
      label: "Pain",
      value: `${formatValue(vitals.painLevel)}/10`,
    });
  }
  if (isFiniteNumber(vitals.bloodGlucose)) {
    summary.push({
      label: "Blood Glucose",
      value: `${formatValue(vitals.bloodGlucose)} mg/dL`,
    });
  }
  return summary;
}
