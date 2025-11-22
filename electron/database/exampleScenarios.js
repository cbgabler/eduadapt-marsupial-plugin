/**
 * Example EHR scenarios for the simulator
 * These represent realistic patient cases for nursing students to practice with
 */

/**
 * Example Scenario: Post-Operative Hypertension Management
 * A 65-year-old patient recovering from surgery with elevated blood pressure
 */
export function getExampleHypertensionScenario() {
  return {
    // Patient Information
    patient: {
      name: "John Martinez",
      age: 65,
      gender: "Male",
      mrn: "MRN-2024-001234",
      dob: "1959-03-15",
      admissionDate: "2024-01-15T08:00:00Z",
      room: "304B",
      attendingPhysician: "Dr. Sarah Chen, MD",
      primaryDiagnosis: "Post-operative hypertension management",
      allergies: [
        {
          substance: "Penicillin",
          reaction: "Rash and hives",
          severity: "Moderate",
        },
        {
          substance: "Latex",
          reaction: "Contact dermatitis",
          severity: "Mild",
        },
      ],
    },

    // Vital Signs (current and historical)
    vitals: {
      current: {
        timestamp: "2024-01-15T14:30:00Z",
        bloodPressure: {
          systolic: 158,
          diastolic: 92,
          unit: "mmHg",
        },
        heartRate: 88,
        respiratoryRate: 18,
        temperature: 98.6,
        temperatureUnit: "F",
        oxygenSaturation: 96,
        painLevel: 4, // 0-10 scale
        weight: 185,
        weightUnit: "lbs",
      },
      history: [
        {
          timestamp: "2024-01-15T08:00:00Z",
          bloodPressure: { systolic: 145, diastolic: 88 },
          heartRate: 82,
          respiratoryRate: 16,
          temperature: 98.4,
          oxygenSaturation: 98,
          painLevel: 6,
        },
        {
          timestamp: "2024-01-15T11:00:00Z",
          bloodPressure: { systolic: 152, diastolic: 90 },
          heartRate: 85,
          respiratoryRate: 17,
          temperature: 98.5,
          oxygenSaturation: 97,
          painLevel: 5,
        },
      ],
    },

    // Active Medications
    medications: [
      {
        id: "med-001",
        name: "Lisinopril",
        dosage: "10 mg",
        route: "PO",
        frequency: "Once daily",
        startDate: "2024-01-15T08:00:00Z",
        status: "Active",
        indication: "Hypertension",
        lastGiven: "2024-01-15T08:15:00Z",
        nextDue: "2024-01-16T08:00:00Z",
        titration: {
          min: 5,
          max: 40,
          step: 5,
          unit: "mg",
          current: 10,
        },
      },
      {
        id: "med-002",
        name: "Acetaminophen",
        dosage: "650 mg",
        route: "PO",
        frequency: "Every 6 hours as needed for pain",
        startDate: "2024-01-15T08:00:00Z",
        status: "Active",
        indication: "Post-operative pain",
        lastGiven: "2024-01-15T12:00:00Z",
        nextDue: "2024-01-15T18:00:00Z",
        prn: true,
      },
      {
        id: "med-003",
        name: "Heparin",
        dosage: "5000 units",
        route: "SubQ",
        frequency: "Every 8 hours",
        startDate: "2024-01-15T08:00:00Z",
        status: "Active",
        indication: "DVT prophylaxis",
        lastGiven: "2024-01-15T14:00:00Z",
        nextDue: "2024-01-15T22:00:00Z",
      },
    ],

    // Provider Orders
    orders: [
      {
        id: "order-001",
        type: "Medication",
        description: "Lisinopril 10 mg PO daily",
        orderedBy: "Dr. Sarah Chen",
        orderedAt: "2024-01-15T08:00:00Z",
        status: "Active",
        priority: "Routine",
      },
      {
        id: "order-002",
        type: "Vital Signs",
        description: "Vital signs every 4 hours",
        orderedBy: "Dr. Sarah Chen",
        orderedAt: "2024-01-15T08:00:00Z",
        status: "Active",
        priority: "Routine",
      },
      {
        id: "order-003",
        type: "Activity",
        description: "Ambulate with assistance TID",
        orderedBy: "Dr. Sarah Chen",
        orderedAt: "2024-01-15T08:00:00Z",
        status: "Active",
        priority: "Routine",
      },
      {
        id: "order-004",
        type: "Diet",
        description: "Cardiac diet - Low sodium",
        orderedBy: "Dr. Sarah Chen",
        orderedAt: "2024-01-15T08:00:00Z",
        status: "Active",
        priority: "Routine",
      },
      {
        id: "order-005",
        type: "Lab",
        description: "Basic Metabolic Panel in AM",
        orderedBy: "Dr. Sarah Chen",
        orderedAt: "2024-01-15T08:00:00Z",
        status: "Pending",
        priority: "Routine",
      },
    ],

    // Lab Results
    labs: [
      {
        id: "lab-001",
        name: "Complete Blood Count (CBC)",
        orderedAt: "2024-01-15T08:00:00Z",
        collectedAt: "2024-01-15T08:30:00Z",
        results: {
          wbc: { value: 7.2, unit: "K/uL", normalRange: "4.0-11.0" },
          rbc: { value: 4.5, unit: "M/uL", normalRange: "4.2-5.4" },
          hemoglobin: { value: 14.2, unit: "g/dL", normalRange: "12.0-16.0" },
          hematocrit: { value: 42, unit: "%", normalRange: "36-46" },
          platelets: { value: 250, unit: "K/uL", normalRange: "150-450" },
        },
        status: "Final",
        reportedAt: "2024-01-15T09:15:00Z",
      },
      {
        id: "lab-002",
        name: "Basic Metabolic Panel",
        orderedAt: "2024-01-15T08:00:00Z",
        collectedAt: "2024-01-15T08:30:00Z",
        results: {
          sodium: { value: 140, unit: "mEq/L", normalRange: "136-145" },
          potassium: { value: 4.2, unit: "mEq/L", normalRange: "3.5-5.0" },
          chloride: { value: 102, unit: "mEq/L", normalRange: "98-107" },
          co2: { value: 24, unit: "mEq/L", normalRange: "22-28" },
          bun: { value: 18, unit: "mg/dL", normalRange: "7-20" },
          creatinine: { value: 1.1, unit: "mg/dL", normalRange: "0.6-1.2" },
          glucose: { value: 95, unit: "mg/dL", normalRange: "70-100" },
        },
        status: "Final",
        reportedAt: "2024-01-15T09:20:00Z",
      },
    ],

    // Clinical Notes
    notes: [
      {
        id: "note-001",
        type: "Nursing Note",
        author: "Nurse Jane Smith, RN",
        timestamp: "2024-01-15T08:00:00Z",
        content:
          "Patient admitted post-operatively. Alert and oriented x3. Incision site clean, dry, and intact. Patient reports mild pain at surgical site, rated 6/10. Vital signs stable. Patient educated on post-operative care and activity restrictions.",
      },
      {
        id: "note-002",
        type: "Provider Note",
        author: "Dr. Sarah Chen, MD",
        timestamp: "2024-01-15T08:15:00Z",
        content:
          "Post-operative day 1. Patient recovering well from procedure. Blood pressure elevated at 145/88. Starting Lisinopril 10 mg daily. Continue monitoring vital signs. Plan for discharge tomorrow if BP improves.",
      },
      {
        id: "note-003",
        type: "Nursing Note",
        author: "Nurse Jane Smith, RN",
        timestamp: "2024-01-15T14:30:00Z",
        content:
          "Vital signs reassessed. Blood pressure remains elevated at 158/92. Patient denies chest pain, shortness of breath, or headache. Notified provider of elevated BP. Patient resting comfortably.",
      },
    ],

    // Assessment Data
    assessment: {
      cardiovascular: {
        heartRate: 88,
        rhythm: "Regular",
        bloodPressure: "158/92",
        peripheralPulses: "2+ bilaterally",
        edema: "None",
        notes: "Elevated blood pressure, otherwise unremarkable",
      },
      respiratory: {
        rate: 18,
        rhythm: "Regular",
        effort: "Unlabored",
        oxygenSaturation: 96,
        lungSounds: "Clear bilaterally",
        notes: "No respiratory distress",
      },
      neurological: {
        levelOfConsciousness: "Alert and oriented x3",
        pupils: "Equal, round, reactive to light",
        motorFunction: "Intact",
        sensation: "Intact",
        notes: "No neurological deficits noted",
      },
      gastrointestinal: {
        appetite: "Fair",
        nausea: "None",
        vomiting: "None",
        bowelSounds: "Active in all quadrants",
        lastBowelMovement: "2024-01-15T07:00:00Z",
        notes: "Tolerating cardiac diet",
      },
      genitourinary: {
        voiding: "Voiding without difficulty",
        output: "Adequate",
        color: "Clear yellow",
        notes: "No urinary complaints",
      },
      integumentary: {
        skinCondition: "Intact",
        incisions: "Clean, dry, and intact",
        wounds: "None",
        notes: "Incision healing well",
      },
      pain: {
        location: "Surgical site",
        intensity: 4,
        quality: "Dull, aching",
        aggravatingFactors: "Movement",
        relievingFactors: "Rest, medication",
        notes: "Pain well controlled with acetaminophen",
      },
    },

    // Simulation Parameters
    simulation: {
      tickIntervalMs: 3000,
      baselineDrift: {
        bloodPressure: { systolic: 0.6, diastolic: 0.3 },
        heartRate: 0.1,
      },
      medicationEffects: {
        "med-001": {
          referenceDose: 10,
          perUnitChange: {
            bloodPressure: { systolic: -0.8, diastolic: -0.4 },
            heartRate: -0.05,
          },
        },
      },
      vitalRanges: {
        bloodPressure: {
          systolic: { min: 110, max: 200 },
          diastolic: { min: 60, max: 120 },
        },
        heartRate: { min: 50, max: 140 },
        respiratoryRate: { min: 10, max: 30 },
      },
      targets: {
        description: "Stabilize BP under 145/90 for 3 consecutive ticks",
        holdTicks: 3,
        vitals: {
          bloodPressure: {
            systolic: { max: 145 },
            diastolic: { max: 90 },
          },
          heartRate: { max: 95 },
        },
      },
      startTime: "2024-01-15T14:30:00Z",
      simulatedTime: "2024-01-15T14:30:00Z", // Can advance independently
      timeMultiplier: 1, // 1 = real time, 60 = 1 minute real = 1 hour simulated
      events: [
        {
          id: "event-001",
          type: "vital_change",
          scheduledTime: "2024-01-15T18:30:00Z",
          description:
            "Blood pressure expected to decrease to 145/85 after medication",
          action: {
            vitals: {
              bloodPressure: { systolic: 145, diastolic: 85 },
            },
          },
        },
        {
          id: "event-002",
          type: "medication_due",
          scheduledTime: "2024-01-15T18:00:00Z",
          description: "Acetaminophen due",
          medicationId: "med-002",
        },
      ],
    },

    // Learning Objectives (for instructors/students)
    learningObjectives: [
      "Assess and monitor blood pressure in post-operative patient",
      "Recognize signs of hypertension",
      "Administer antihypertensive medications safely",
      "Document vital signs accurately",
      "Recognize when to notify provider of abnormal findings",
      "Provide patient education on hypertension management",
    ],

    // Scenario Metadata
    metadata: {
      difficulty: "Intermediate",
      estimatedDuration: "30-45 minutes",
      specialty: "Medical-Surgical Nursing",
      tags: [
        "Hypertension",
        "Post-operative",
        "Cardiovascular",
        "Medication Management",
      ],
    },
  };
}

/**
 * Example Scenario: Diabetic Patient with Hypoglycemia
 * A 45-year-old diabetic patient experiencing low blood sugar
 */
export function getExampleDiabetesScenario() {
  return {
    patient: {
      name: "Maria Rodriguez",
      age: 45,
      gender: "Female",
      mrn: "MRN-2024-002345",
      dob: "1979-07-22",
      admissionDate: "2024-01-16T10:00:00Z",
      room: "205A",
      attendingPhysician: "Dr. Michael Park, MD",
      primaryDiagnosis: "Type 2 Diabetes - Hypoglycemia episode",
      allergies: [
        {
          substance: "Sulfa drugs",
          reaction: "Rash",
          severity: "Mild",
        },
      ],
    },
    vitals: {
      current: {
        timestamp: "2024-01-16T10:15:00Z",
        bloodPressure: { systolic: 118, diastolic: 72 },
        heartRate: 95,
        respiratoryRate: 20,
        temperature: 98.8,
        temperatureUnit: "F",
        oxygenSaturation: 98,
        painLevel: 0,
        bloodGlucose: 62, // Low!
        weight: 165,
        weightUnit: "lbs",
      },
    },
    medications: [
      {
        id: "med-101",
        name: "Metformin",
        dosage: "1000 mg",
        route: "PO",
        frequency: "Twice daily with meals",
        status: "Active",
        indication: "Type 2 Diabetes",
      },
      {
        id: "med-102",
        name: "Glipizide",
        dosage: "5 mg",
        route: "PO",
        frequency: "Once daily before breakfast",
        status: "Active",
        indication: "Type 2 Diabetes",
        titration: {
          min: 2.5,
          max: 10,
          step: 2.5,
          unit: "mg",
          current: 5,
        },
      },
    ],
    orders: [
      {
        id: "order-101",
        type: "Medication",
        description: "Dextrose 50% IV push for hypoglycemia",
        orderedBy: "Dr. Michael Park",
        orderedAt: "2024-01-16T10:15:00Z",
        status: "Active",
        priority: "STAT",
      },
      {
        id: "order-102",
        type: "Lab",
        description: "Blood glucose monitoring every 1 hour x4",
        orderedBy: "Dr. Michael Park",
        orderedAt: "2024-01-16T10:15:00Z",
        status: "Active",
        priority: "Routine",
      },
    ],
    simulation: {
      tickIntervalMs: 2000,
      baselineDrift: {
        bloodGlucose: -1.5,
        heartRate: -0.1,
      },
      medicationEffects: {
        "med-102": {
          referenceDose: 5,
          perUnitChange: {
            bloodGlucose: -3,
          },
        },
      },
      vitalRanges: {
        bloodGlucose: { min: 50, max: 250 },
        heartRate: { min: 50, max: 140 },
      },
      targets: {
        description: "Normalize blood glucose between 90-110 mg/dL for 2 ticks",
        holdTicks: 2,
        vitals: {
          bloodGlucose: { min: 90, max: 110 },
          heartRate: { min: 70, max: 110 },
        },
      },
    },
    learningObjectives: [
      "Recognize signs and symptoms of hypoglycemia",
      "Administer emergency glucose treatment",
      "Monitor blood glucose levels",
      "Provide patient education on diabetes management",
    ],
    metadata: {
      difficulty: "Beginner",
      estimatedDuration: "20-30 minutes",
      specialty: "Medical-Surgical Nursing",
      tags: ["Diabetes", "Hypoglycemia", "Endocrine", "Emergency"],
    },
  };
}

/**
 * Seeds the database with example scenarios
 * Call this function after database initialization to populate with sample data
 */
export async function seedExampleScenarios() {
  // Dynamic import to avoid circular dependency
  const { createScenario, getAllScenarios } = await import("./models/scenarios.js");

  // Check if scenarios already exist
  const existingScenarios = getAllScenarios();
  if (existingScenarios.length > 0) {
    console.log("Scenarios already exist, skipping seed");
    return existingScenarios;
  }

  const scenarios = [
    {
      name: "Post-Operative Hypertension Management",
      definition: getExampleHypertensionScenario(),
    },
    {
      name: "Diabetic Patient with Hypoglycemia",
      definition: getExampleDiabetesScenario(),
    },
  ];

  const createdScenarios = [];
  for (const scenario of scenarios) {
    try {
      const id = createScenario(scenario.name, scenario.definition);
      createdScenarios.push({ id, name: scenario.name });
      console.log(`Created example scenario: ${scenario.name} (ID: ${id})`);
    } catch (error) {
      console.error(`Error creating scenario ${scenario.name}:`, error);
    }
  }

  return createdScenarios;
}
