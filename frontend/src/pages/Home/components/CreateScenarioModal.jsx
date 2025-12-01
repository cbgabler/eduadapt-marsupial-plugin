import { useState } from "react";

function CreateScenarioModal({ onClose, onCreateSuccess }) {
  const [scenarioName, setScenarioName] = useState("");
  const [patientName, setPatientName] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [patientGender, setPatientGender] = useState("Male");
  const [patientMRN, setPatientMRN] = useState("");
  const [primaryDiagnosis, setPrimaryDiagnosis] = useState("");
  const [room, setRoom] = useState("");
  const [attendingPhysician, setAttendingPhysician] = useState("");
  
  // Allergies
  const [allergies, setAllergies] = useState([]);
  
  // Initial Vitals
  const [systolicBP, setSystolicBP] = useState("");
  const [diastolicBP, setDiastolicBP] = useState("");
  const [heartRate, setHeartRate] = useState("");
  const [respiratoryRate, setRespiratoryRate] = useState("");
  const [temperature, setTemperature] = useState("");
  const [oxygenSaturation, setOxygenSaturation] = useState("");
  const [painLevel, setPainLevel] = useState("0");
  const [weight, setWeight] = useState("");
  
  // Medications (array)
  const [medications, setMedications] = useState([
    { id: 1, name: "", dosage: "", route: "PO", frequency: "", indication: "", prn: false, titration: { min: 1, max: 100, step: 1, unit: "mg" } }
  ]);
  
  // Provider Orders
  const [orders, setOrders] = useState([]);
  
  // Learning Objectives
  const [learningObjectives, setLearningObjectives] = useState([""]);
  
  // Tags
  const [tags, setTags] = useState([]);
  
  // Simulation Parameters
  const [tickInterval, setTickInterval] = useState("5000");
  const [targetSystolic, setTargetSystolic] = useState("");
  const [targetDiastolic, setTargetDiastolic] = useState("");
  const [holdTicks, setHoldTicks] = useState("3");
  
  // Metadata
  const [difficulty, setDifficulty] = useState("Intermediate");
  const [estimatedDuration, setEstimatedDuration] = useState("30-45 minutes");
  const [specialty, setSpecialty] = useState("General Nursing");
  
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const isSuccessMessage = message.toLowerCase().includes("success");

  // Helper functions for managing arrays
  const addAllergy = () => {
    setAllergies([...allergies, { substance: "", reaction: "", severity: "Mild" }]);
  };

  const removeAllergy = (index) => {
    setAllergies(allergies.filter((_, i) => i !== index));
  };

  const updateAllergy = (index, field, value) => {
    const updated = [...allergies];
    updated[index] = { ...updated[index], [field]: value };
    setAllergies(updated);
  };

  const addMedication = () => {
    setMedications([...medications, { 
      id: medications.length + 1, 
      name: "", 
      dosage: "", 
      route: "PO", 
      frequency: "", 
      indication: "", 
      prn: false,
      titration: { min: 1, max: 100, step: 1, unit: "mg" }
    }]);
  };

  const removeMedication = (index) => {
    setMedications(medications.filter((_, i) => i !== index));
  };

  const updateMedication = (index, field, value) => {
    const updated = [...medications];
    if (field === "prn") {
      updated[index] = { ...updated[index], [field]: value };
    } else if (field.startsWith("titration.")) {
      const titrationField = field.split(".")[1];
      updated[index] = {
        ...updated[index],
        titration: {
          ...updated[index].titration,
          [titrationField]: titrationField === "min" || titrationField === "max" || titrationField === "step" 
            ? parseInt(value, 10) || 0 
            : value
        }
      };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setMedications(updated);
  };

  const addOrder = () => {
    setOrders([...orders, { type: "Medication", description: "", orderedBy: "", status: "Active", priority: "Routine" }]);
  };

  const removeOrder = (index) => {
    setOrders(orders.filter((_, i) => i !== index));
  };

  const updateOrder = (index, field, value) => {
    const updated = [...orders];
    updated[index] = { ...updated[index], [field]: value };
    setOrders(updated);
  };

  const addLearningObjective = () => {
    setLearningObjectives([...learningObjectives, ""]);
  };

  const removeLearningObjective = (index) => {
    setLearningObjectives(learningObjectives.filter((_, i) => i !== index));
  };

  const updateLearningObjective = (index, value) => {
    const updated = [...learningObjectives];
    updated[index] = value;
    setLearningObjectives(updated);
  };

  const addTag = () => {
    setTags([...tags, ""]);
  };

  const removeTag = (index) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const updateTag = (index, value) => {
    const updated = [...tags];
    updated[index] = value;
    setTags(updated);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setMessage("");

    try {
      if (!window.api?.createScenario) {
        setMessage(
          "Error: Electron API is not available. Please run this in Electron."
        );
        setIsLoading(false);
        return;
      }

      // Validation
      if (!scenarioName.trim()) {
        setMessage("Please enter a scenario name.");
        setIsLoading(false);
        return;
      }

      if (!patientName.trim() || !patientAge || !primaryDiagnosis.trim()) {
        setMessage("Please fill in all required patient information.");
        setIsLoading(false);
        return;
      }

      if (!systolicBP || !diastolicBP || !heartRate || !respiratoryRate) {
        setMessage("Please fill in all required vital signs.");
        setIsLoading(false);
        return;
      }

      const validMedications = medications.filter(m => m.name.trim() && m.dosage.trim());
      if (validMedications.length === 0) {
        setMessage("Please enter at least one medication with name and dosage.");
        setIsLoading(false);
        return;
      }

      // Generate MRN if not provided
      const mrn = patientMRN.trim() || `MRN-${Date.now()}`;
      const currentTime = new Date().toISOString();

      // Build scenario definition
      const scenarioDefinition = {
        patient: {
          name: patientName.trim(),
          age: parseInt(patientAge, 10),
          gender: patientGender,
          mrn: mrn,
          dob: new Date(new Date().setFullYear(new Date().getFullYear() - parseInt(patientAge, 10))).toISOString().split('T')[0],
          admissionDate: currentTime,
          room: room.trim() || "TBD",
          attendingPhysician: attendingPhysician.trim() || "TBD",
          primaryDiagnosis: primaryDiagnosis.trim(),
          allergies: allergies.filter(a => a.substance.trim()).map(a => ({
            substance: a.substance.trim(),
            reaction: a.reaction.trim(),
            severity: a.severity || "Mild",
          })),
        },
        vitals: {
          current: {
            timestamp: currentTime,
            bloodPressure: {
              systolic: parseInt(systolicBP, 10),
              diastolic: parseInt(diastolicBP, 10),
              unit: "mmHg",
            },
            heartRate: parseInt(heartRate, 10),
            respiratoryRate: parseInt(respiratoryRate, 10),
            temperature: temperature ? parseFloat(temperature) : 98.6,
            temperatureUnit: "F",
            oxygenSaturation: oxygenSaturation ? parseInt(oxygenSaturation, 10) : 98,
            painLevel: parseInt(painLevel, 10) || 0,
            weight: weight ? parseFloat(weight) : 150,
            weightUnit: "lbs",
          },
          history: [],
        },
        medications: validMedications.map((med, index) => {
          const medId = `med-${String(index + 1).padStart(3, '0')}`;
          const doseValue = parseFloat(med.dosage.replace(/[^0-9.]/g, '')) || 10;
          return {
            id: medId,
            name: med.name.trim(),
            dosage: med.dosage.trim(),
            route: med.route || "PO",
            frequency: med.frequency.trim() || "As ordered",
            startDate: currentTime,
            status: "Active",
            indication: med.indication.trim() || primaryDiagnosis.trim(),
            lastGiven: currentTime,
            nextDue: currentTime,
            ...(med.prn && { prn: true }),
            ...(med.titration && {
              titration: {
                min: med.titration.min || 1,
                max: med.titration.max || 100,
                step: med.titration.step || 1,
                unit: med.titration.unit || "mg",
                current: doseValue,
              },
            }),
          };
        }),
        orders: orders.filter(o => o.description.trim()).map((order, index) => ({
          id: `order-${String(index + 1).padStart(3, '0')}`,
          type: order.type || "Medication",
          description: order.description.trim(),
          orderedBy: order.orderedBy.trim() || attendingPhysician.trim() || "TBD",
          orderedAt: currentTime,
          status: order.status || "Active",
          priority: order.priority || "Routine",
        })),
        labs: [],
        notes: [],
        assessment: {},
        simulation: {
          tickIntervalMs: parseInt(tickInterval, 10) || 5000,
          baselineDrift: {
            bloodPressure: { systolic: 0.5, diastolic: 0.3 },
            heartRate: 0.1,
          },
          medicationEffects: validMedications.reduce((acc, med, index) => {
            const medId = `med-${String(index + 1).padStart(3, '0')}`;
            const doseValue = parseFloat(med.dosage.replace(/[^0-9.]/g, '')) || 10;
            acc[medId] = {
              referenceDose: doseValue,
              perUnitChange: {
                bloodPressure: { systolic: -0.5, diastolic: -0.3 },
                heartRate: -0.05,
              },
            };
            return acc;
          }, {}),
          vitalRanges: {
            bloodPressure: {
              systolic: { min: 90, max: 200 },
              diastolic: { min: 50, max: 120 },
            },
            heartRate: { min: 40, max: 150 },
            respiratoryRate: { min: 8, max: 35 },
          },
          targets: targetSystolic && targetDiastolic ? {
            description: `Stabilize BP under ${targetSystolic}/${targetDiastolic} for ${holdTicks} consecutive ticks`,
            holdTicks: parseInt(holdTicks, 10) || 3,
            vitals: {
              bloodPressure: {
                systolic: { max: parseInt(targetSystolic, 10) },
                diastolic: { max: parseInt(targetDiastolic, 10) },
              },
            },
          } : null,
          startTime: currentTime,
          simulatedTime: currentTime,
          timeMultiplier: 1,
          events: [],
        },
        learningObjectives: learningObjectives.filter(obj => obj.trim()),
        metadata: {
          difficulty: difficulty,
          estimatedDuration: estimatedDuration.trim(),
          specialty: specialty.trim(),
          tags: tags.length > 0 ? tags.filter(t => t.trim()) : [primaryDiagnosis.trim()],
        },
      };

      const result = await window.api.createScenario({
        name: scenarioName.trim(),
        definition: scenarioDefinition,
      });

      if (result.success) {
        setMessage("Scenario created successfully!");
        setTimeout(() => {
          onCreateSuccess?.();
          onClose?.();
        }, 1500);
      } else {
        setMessage(result.error || "Failed to create scenario. Please try again.");
      }
    } catch (err) {
      setMessage(`Error creating scenario: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h2>Create New Scenario</h2>
          <button className="modal-close" onClick={onClose} type="button">
            &times;
          </button>
        </div>

        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            {/* Scenario Name */}
            <div style={{ marginBottom: "var(--ehr-spacing-lg)" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "var(--ehr-spacing-sm)",
                  color: "var(--ehr-text-primary)",
                  fontWeight: 500,
                }}
              >
                Scenario Name <span style={{ color: "var(--ehr-error)" }}>*</span>
              </label>
              <input
                type="text"
                value={scenarioName}
                onChange={(event) => setScenarioName(event.target.value)}
                placeholder="e.g., Post-Operative Hypertension Management"
                style={{
                  width: "100%",
                  padding: "var(--ehr-spacing-sm)",
                  borderRadius: "var(--ehr-radius-md)",
                  border: "1px solid var(--ehr-border)",
                  backgroundColor: "var(--ehr-bg-primary)",
                  color: "var(--ehr-text-primary)",
                }}
                required
              />
            </div>

            {/* Patient Information */}
            <div style={{ marginBottom: "var(--ehr-spacing-lg)" }}>
              <h3 style={{ color: "var(--ehr-primary)", marginBottom: "var(--ehr-spacing-md)" }}>
                Patient Information
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--ehr-spacing-md)" }}>
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "var(--ehr-spacing-sm)",
                      color: "var(--ehr-text-primary)",
                      fontWeight: 500,
                    }}
                  >
                    Patient Name <span style={{ color: "var(--ehr-error)" }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={patientName}
                    onChange={(event) => setPatientName(event.target.value)}
                    placeholder="e.g., John Martinez"
                    style={{
                      width: "100%",
                      padding: "var(--ehr-spacing-sm)",
                      borderRadius: "var(--ehr-radius-md)",
                      border: "1px solid var(--ehr-border)",
                      backgroundColor: "var(--ehr-bg-primary)",
                      color: "var(--ehr-text-primary)",
                    }}
                    required
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "var(--ehr-spacing-sm)",
                      color: "var(--ehr-text-primary)",
                      fontWeight: 500,
                    }}
                  >
                    Age <span style={{ color: "var(--ehr-error)" }}>*</span>
                  </label>
                  <input
                    type="number"
                    value={patientAge}
                    onChange={(event) => setPatientAge(event.target.value)}
                    placeholder="e.g., 65"
                    min="1"
                    max="120"
                    style={{
                      width: "100%",
                      padding: "var(--ehr-spacing-sm)",
                      borderRadius: "var(--ehr-radius-md)",
                      border: "1px solid var(--ehr-border)",
                      backgroundColor: "var(--ehr-bg-primary)",
                      color: "var(--ehr-text-primary)",
                    }}
                    required
                  />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--ehr-spacing-md)", marginTop: "var(--ehr-spacing-md)" }}>
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "var(--ehr-spacing-sm)",
                      color: "var(--ehr-text-primary)",
                      fontWeight: 500,
                    }}
                  >
                    Gender
                  </label>
                  <select
                    value={patientGender}
                    onChange={(event) => setPatientGender(event.target.value)}
                    style={{
                      width: "100%",
                      padding: "var(--ehr-spacing-sm)",
                      borderRadius: "var(--ehr-radius-md)",
                      border: "1px solid var(--ehr-border)",
                      backgroundColor: "var(--ehr-bg-primary)",
                      color: "var(--ehr-text-primary)",
                    }}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "var(--ehr-spacing-sm)",
                      color: "var(--ehr-text-primary)",
                      fontWeight: 500,
                    }}
                  >
                    MRN (optional)
                  </label>
                  <input
                    type="text"
                    value={patientMRN}
                    onChange={(event) => setPatientMRN(event.target.value)}
                    placeholder="Auto-generated if empty"
                    style={{
                      width: "100%",
                      padding: "var(--ehr-spacing-sm)",
                      borderRadius: "var(--ehr-radius-md)",
                      border: "1px solid var(--ehr-border)",
                      backgroundColor: "var(--ehr-bg-primary)",
                      color: "var(--ehr-text-primary)",
                    }}
                  />
                </div>
              </div>
              <div style={{ marginTop: "var(--ehr-spacing-md)" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "var(--ehr-spacing-sm)",
                    color: "var(--ehr-text-primary)",
                    fontWeight: 500,
                  }}
                >
                  Primary Diagnosis <span style={{ color: "var(--ehr-error)" }}>*</span>
                </label>
                <input
                  type="text"
                  value={primaryDiagnosis}
                  onChange={(event) => setPrimaryDiagnosis(event.target.value)}
                  placeholder="e.g., Post-operative hypertension management"
                  style={{
                    width: "100%",
                    padding: "var(--ehr-spacing-sm)",
                    borderRadius: "var(--ehr-radius-md)",
                    border: "1px solid var(--ehr-border)",
                    backgroundColor: "var(--ehr-bg-primary)",
                    color: "var(--ehr-text-primary)",
                  }}
                  required
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--ehr-spacing-md)", marginTop: "var(--ehr-spacing-md)" }}>
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "var(--ehr-spacing-sm)",
                      color: "var(--ehr-text-primary)",
                      fontWeight: 500,
                    }}
                  >
                    Room
                  </label>
                  <input
                    type="text"
                    value={room}
                    onChange={(event) => setRoom(event.target.value)}
                    placeholder="e.g., 304B"
                    style={{
                      width: "100%",
                      padding: "var(--ehr-spacing-sm)",
                      borderRadius: "var(--ehr-radius-md)",
                      border: "1px solid var(--ehr-border)",
                      backgroundColor: "var(--ehr-bg-primary)",
                      color: "var(--ehr-text-primary)",
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "var(--ehr-spacing-sm)",
                      color: "var(--ehr-text-primary)",
                      fontWeight: 500,
                    }}
                  >
                    Attending Physician
                  </label>
                  <input
                    type="text"
                    value={attendingPhysician}
                    onChange={(event) => setAttendingPhysician(event.target.value)}
                    placeholder="e.g., Dr. Sarah Chen, MD"
                    style={{
                      width: "100%",
                      padding: "var(--ehr-spacing-sm)",
                      borderRadius: "var(--ehr-radius-md)",
                      border: "1px solid var(--ehr-border)",
                      backgroundColor: "var(--ehr-bg-primary)",
                      color: "var(--ehr-text-primary)",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Allergies */}
            <div style={{ marginBottom: "var(--ehr-spacing-lg)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--ehr-spacing-md)" }}>
                <h3 style={{ color: "var(--ehr-primary)", margin: 0 }}>
                  Allergies
                </h3>
                <button
                  type="button"
                  onClick={addAllergy}
                  className="modal-button secondary"
                  style={{ padding: "var(--ehr-spacing-xs) var(--ehr-spacing-md)" }}
                >
                  + Add Allergy
                </button>
              </div>
              {allergies.map((allergy, index) => (
                <div key={index} style={{ 
                  display: "grid", 
                  gridTemplateColumns: "2fr 2fr 1fr auto", 
                  gap: "var(--ehr-spacing-md)",
                  marginBottom: "var(--ehr-spacing-md)",
                  padding: "var(--ehr-spacing-md)",
                  backgroundColor: "var(--ehr-bg-secondary)",
                  borderRadius: "var(--ehr-radius-md)"
                }}>
                  <input
                    type="text"
                    value={allergy.substance}
                    onChange={(e) => updateAllergy(index, "substance", e.target.value)}
                    placeholder="Substance (e.g., Penicillin)"
                    style={{
                      padding: "var(--ehr-spacing-sm)",
                      borderRadius: "var(--ehr-radius-md)",
                      border: "1px solid var(--ehr-border)",
                      backgroundColor: "var(--ehr-bg-primary)",
                      color: "var(--ehr-text-primary)",
                    }}
                  />
                  <input
                    type="text"
                    value={allergy.reaction}
                    onChange={(e) => updateAllergy(index, "reaction", e.target.value)}
                    placeholder="Reaction (e.g., Rash and hives)"
                    style={{
                      padding: "var(--ehr-spacing-sm)",
                      borderRadius: "var(--ehr-radius-md)",
                      border: "1px solid var(--ehr-border)",
                      backgroundColor: "var(--ehr-bg-primary)",
                      color: "var(--ehr-text-primary)",
                    }}
                  />
                  <select
                    value={allergy.severity}
                    onChange={(e) => updateAllergy(index, "severity", e.target.value)}
                    style={{
                      padding: "var(--ehr-spacing-sm)",
                      borderRadius: "var(--ehr-radius-md)",
                      border: "1px solid var(--ehr-border)",
                      backgroundColor: "var(--ehr-bg-primary)",
                      color: "var(--ehr-text-primary)",
                    }}
                  >
                    <option value="Mild">Mild</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Severe">Severe</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => removeAllergy(index)}
                    style={{
                      padding: "var(--ehr-spacing-xs) var(--ehr-spacing-md)",
                      backgroundColor: "var(--ehr-error)",
                      color: "var(--ehr-text-inverse)",
                      border: "none",
                      borderRadius: "var(--ehr-radius-md)",
                      cursor: "pointer",
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
              {allergies.length === 0 && (
                <p style={{ color: "var(--ehr-text-secondary)", fontStyle: "italic" }}>
                  No allergies added. Click "Add Allergy" to add one.
                </p>
              )}
            </div>

            {/* Initial Vitals */}
            <div style={{ marginBottom: "var(--ehr-spacing-lg)" }}>
              <h3 style={{ color: "var(--ehr-primary)", marginBottom: "var(--ehr-spacing-md)" }}>
                Initial Vital Signs
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "var(--ehr-spacing-md)" }}>
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "var(--ehr-spacing-sm)",
                      color: "var(--ehr-text-primary)",
                      fontWeight: 500,
                    }}
                  >
                    Systolic BP <span style={{ color: "var(--ehr-error)" }}>*</span>
                  </label>
                  <input
                    type="number"
                    value={systolicBP}
                    onChange={(event) => setSystolicBP(event.target.value)}
                    placeholder="e.g., 158"
                    min="50"
                    max="250"
                    style={{
                      width: "100%",
                      padding: "var(--ehr-spacing-sm)",
                      borderRadius: "var(--ehr-radius-md)",
                      border: "1px solid var(--ehr-border)",
                      backgroundColor: "var(--ehr-bg-primary)",
                      color: "var(--ehr-text-primary)",
                    }}
                    required
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "var(--ehr-spacing-sm)",
                      color: "var(--ehr-text-primary)",
                      fontWeight: 500,
                    }}
                  >
                    Diastolic BP <span style={{ color: "var(--ehr-error)" }}>*</span>
                  </label>
                  <input
                    type="number"
                    value={diastolicBP}
                    onChange={(event) => setDiastolicBP(event.target.value)}
                    placeholder="e.g., 92"
                    min="30"
                    max="150"
                    style={{
                      width: "100%",
                      padding: "var(--ehr-spacing-sm)",
                      borderRadius: "var(--ehr-radius-md)",
                      border: "1px solid var(--ehr-border)",
                      backgroundColor: "var(--ehr-bg-primary)",
                      color: "var(--ehr-text-primary)",
                    }}
                    required
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "var(--ehr-spacing-sm)",
                      color: "var(--ehr-text-primary)",
                      fontWeight: 500,
                    }}
                  >
                    Heart Rate <span style={{ color: "var(--ehr-error)" }}>*</span>
                  </label>
                  <input
                    type="number"
                    value={heartRate}
                    onChange={(event) => setHeartRate(event.target.value)}
                    placeholder="e.g., 88"
                    min="30"
                    max="200"
                    style={{
                      width: "100%",
                      padding: "var(--ehr-spacing-sm)",
                      borderRadius: "var(--ehr-radius-md)",
                      border: "1px solid var(--ehr-border)",
                      backgroundColor: "var(--ehr-bg-primary)",
                      color: "var(--ehr-text-primary)",
                    }}
                    required
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "var(--ehr-spacing-sm)",
                      color: "var(--ehr-text-primary)",
                      fontWeight: 500,
                    }}
                  >
                    Respiratory Rate <span style={{ color: "var(--ehr-error)" }}>*</span>
                  </label>
                  <input
                    type="number"
                    value={respiratoryRate}
                    onChange={(event) => setRespiratoryRate(event.target.value)}
                    placeholder="e.g., 18"
                    min="5"
                    max="50"
                    style={{
                      width: "100%",
                      padding: "var(--ehr-spacing-sm)",
                      borderRadius: "var(--ehr-radius-md)",
                      border: "1px solid var(--ehr-border)",
                      backgroundColor: "var(--ehr-bg-primary)",
                      color: "var(--ehr-text-primary)",
                    }}
                    required
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "var(--ehr-spacing-sm)",
                      color: "var(--ehr-text-primary)",
                      fontWeight: 500,
                    }}
                  >
                    Temperature (°F)
                  </label>
                  <input
                    type="number"
                    value={temperature}
                    onChange={(event) => setTemperature(event.target.value)}
                    placeholder="e.g., 98.6"
                    min="90"
                    max="110"
                    step="0.1"
                    style={{
                      width: "100%",
                      padding: "var(--ehr-spacing-sm)",
                      borderRadius: "var(--ehr-radius-md)",
                      border: "1px solid var(--ehr-border)",
                      backgroundColor: "var(--ehr-bg-primary)",
                      color: "var(--ehr-text-primary)",
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "var(--ehr-spacing-sm)",
                      color: "var(--ehr-text-primary)",
                      fontWeight: 500,
                    }}
                  >
                    O2 Saturation (%)
                  </label>
                  <input
                    type="number"
                    value={oxygenSaturation}
                    onChange={(event) => setOxygenSaturation(event.target.value)}
                    placeholder="e.g., 96"
                    min="70"
                    max="100"
                    style={{
                      width: "100%",
                      padding: "var(--ehr-spacing-sm)",
                      borderRadius: "var(--ehr-radius-md)",
                      border: "1px solid var(--ehr-border)",
                      backgroundColor: "var(--ehr-bg-primary)",
                      color: "var(--ehr-text-primary)",
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "var(--ehr-spacing-sm)",
                      color: "var(--ehr-text-primary)",
                      fontWeight: 500,
                    }}
                  >
                    Pain Level (0-10)
                  </label>
                  <input
                    type="number"
                    value={painLevel}
                    onChange={(event) => setPainLevel(event.target.value)}
                    placeholder="0"
                    min="0"
                    max="10"
                    style={{
                      width: "100%",
                      padding: "var(--ehr-spacing-sm)",
                      borderRadius: "var(--ehr-radius-md)",
                      border: "1px solid var(--ehr-border)",
                      backgroundColor: "var(--ehr-bg-primary)",
                      color: "var(--ehr-text-primary)",
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "var(--ehr-spacing-sm)",
                      color: "var(--ehr-text-primary)",
                      fontWeight: 500,
                    }}
                  >
                    Weight (lbs)
                  </label>
                  <input
                    type="number"
                    value={weight}
                    onChange={(event) => setWeight(event.target.value)}
                    placeholder="e.g., 185"
                    min="1"
                    step="0.1"
                    style={{
                      width: "100%",
                      padding: "var(--ehr-spacing-sm)",
                      borderRadius: "var(--ehr-radius-md)",
                      border: "1px solid var(--ehr-border)",
                      backgroundColor: "var(--ehr-bg-primary)",
                      color: "var(--ehr-text-primary)",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Medications */}
            <div style={{ marginBottom: "var(--ehr-spacing-lg)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--ehr-spacing-md)" }}>
                <h3 style={{ color: "var(--ehr-primary)", margin: 0 }}>
                  Medications <span style={{ color: "var(--ehr-error)" }}>*</span>
                </h3>
                <button
                  type="button"
                  onClick={addMedication}
                  className="modal-button secondary"
                  style={{ padding: "var(--ehr-spacing-xs) var(--ehr-spacing-md)" }}
                >
                  + Add Medication
                </button>
              </div>
              {medications.map((med, index) => (
                <div key={med.id} style={{ 
                  marginBottom: "var(--ehr-spacing-md)",
                  padding: "var(--ehr-spacing-md)",
                  backgroundColor: "var(--ehr-bg-secondary)",
                  borderRadius: "var(--ehr-radius-md)",
                  border: "1px solid var(--ehr-border)"
                }}>
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: "var(--ehr-spacing-md)", marginBottom: "var(--ehr-spacing-md)" }}>
                    <div>
                      <label style={{ display: "block", marginBottom: "var(--ehr-spacing-sm)", color: "var(--ehr-text-primary)", fontWeight: 500 }}>
                        Medication Name <span style={{ color: "var(--ehr-error)" }}>*</span>
                      </label>
                      <input
                        type="text"
                        value={med.name}
                        onChange={(e) => updateMedication(index, "name", e.target.value)}
                        placeholder="e.g., Lisinopril"
                        style={{
                          width: "100%",
                          padding: "var(--ehr-spacing-sm)",
                          borderRadius: "var(--ehr-radius-md)",
                          border: "1px solid var(--ehr-border)",
                          backgroundColor: "var(--ehr-bg-primary)",
                          color: "var(--ehr-text-primary)",
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", marginBottom: "var(--ehr-spacing-sm)", color: "var(--ehr-text-primary)", fontWeight: 500 }}>
                        Dose <span style={{ color: "var(--ehr-error)" }}>*</span>
                      </label>
                      <input
                        type="text"
                        value={med.dosage}
                        onChange={(e) => updateMedication(index, "dosage", e.target.value)}
                        placeholder="e.g., 10 mg"
                        style={{
                          width: "100%",
                          padding: "var(--ehr-spacing-sm)",
                          borderRadius: "var(--ehr-radius-md)",
                          border: "1px solid var(--ehr-border)",
                          backgroundColor: "var(--ehr-bg-primary)",
                          color: "var(--ehr-text-primary)",
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", marginBottom: "var(--ehr-spacing-sm)", color: "var(--ehr-text-primary)", fontWeight: 500 }}>
                        Route
                      </label>
                      <select
                        value={med.route}
                        onChange={(e) => updateMedication(index, "route", e.target.value)}
                        style={{
                          width: "100%",
                          padding: "var(--ehr-spacing-sm)",
                          borderRadius: "var(--ehr-radius-md)",
                          border: "1px solid var(--ehr-border)",
                          backgroundColor: "var(--ehr-bg-primary)",
                          color: "var(--ehr-text-primary)",
                        }}
                      >
                        <option value="PO">PO</option>
                        <option value="IV">IV</option>
                        <option value="IM">IM</option>
                        <option value="SubQ">SubQ</option>
                        <option value="Topical">Topical</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: "block", marginBottom: "var(--ehr-spacing-sm)", color: "var(--ehr-text-primary)", fontWeight: 500 }}>
                        Frequency
                      </label>
                      <input
                        type="text"
                        value={med.frequency}
                        onChange={(e) => updateMedication(index, "frequency", e.target.value)}
                        placeholder="e.g., Once daily"
                        style={{
                          width: "100%",
                          padding: "var(--ehr-spacing-sm)",
                          borderRadius: "var(--ehr-radius-md)",
                          border: "1px solid var(--ehr-border)",
                          backgroundColor: "var(--ehr-bg-primary)",
                          color: "var(--ehr-text-primary)",
                        }}
                      />
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr auto", gap: "var(--ehr-spacing-md)", alignItems: "end" }}>
                    <div>
                      <label style={{ display: "block", marginBottom: "var(--ehr-spacing-sm)", color: "var(--ehr-text-primary)", fontWeight: 500 }}>
                        Indication
                      </label>
                      <input
                        type="text"
                        value={med.indication}
                        onChange={(e) => updateMedication(index, "indication", e.target.value)}
                        placeholder="e.g., Hypertension"
                        style={{
                          width: "100%",
                          padding: "var(--ehr-spacing-sm)",
                          borderRadius: "var(--ehr-radius-md)",
                          border: "1px solid var(--ehr-border)",
                          backgroundColor: "var(--ehr-bg-primary)",
                          color: "var(--ehr-text-primary)",
                        }}
                      />
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "var(--ehr-spacing-sm)" }}>
                      <input
                        type="checkbox"
                        checked={med.prn}
                        onChange={(e) => updateMedication(index, "prn", e.target.checked)}
                        id={`prn-${index}`}
                        style={{ width: "auto" }}
                      />
                      <label htmlFor={`prn-${index}`} style={{ color: "var(--ehr-text-primary)", margin: 0 }}>
                        PRN
                      </label>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeMedication(index)}
                      style={{
                        padding: "var(--ehr-spacing-xs) var(--ehr-spacing-md)",
                        backgroundColor: "var(--ehr-error)",
                        color: "var(--ehr-text-inverse)",
                        border: "none",
                        borderRadius: "var(--ehr-radius-md)",
                        cursor: "pointer",
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Provider Orders */}
            <div style={{ marginBottom: "var(--ehr-spacing-lg)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--ehr-spacing-md)" }}>
                <h3 style={{ color: "var(--ehr-primary)", margin: 0 }}>
                  Provider Orders
                </h3>
                <button
                  type="button"
                  onClick={addOrder}
                  className="modal-button secondary"
                  style={{ padding: "var(--ehr-spacing-xs) var(--ehr-spacing-md)" }}
                >
                  + Add Order
                </button>
              </div>
              {orders.map((order, index) => (
                <div key={index} style={{ 
                  display: "grid", 
                  gridTemplateColumns: "1fr 2fr 1fr 1fr auto", 
                  gap: "var(--ehr-spacing-md)",
                  marginBottom: "var(--ehr-spacing-md)",
                  padding: "var(--ehr-spacing-md)",
                  backgroundColor: "var(--ehr-bg-secondary)",
                  borderRadius: "var(--ehr-radius-md)"
                }}>
                  <select
                    value={order.type}
                    onChange={(e) => updateOrder(index, "type", e.target.value)}
                    style={{
                      padding: "var(--ehr-spacing-sm)",
                      borderRadius: "var(--ehr-radius-md)",
                      border: "1px solid var(--ehr-border)",
                      backgroundColor: "var(--ehr-bg-primary)",
                      color: "var(--ehr-text-primary)",
                    }}
                  >
                    <option value="Medication">Medication</option>
                    <option value="Vital Signs">Vital Signs</option>
                    <option value="Activity">Activity</option>
                    <option value="Diet">Diet</option>
                    <option value="Lab">Lab</option>
                    <option value="Other">Other</option>
                  </select>
                  <input
                    type="text"
                    value={order.description}
                    onChange={(e) => updateOrder(index, "description", e.target.value)}
                    placeholder="Order description"
                    style={{
                      padding: "var(--ehr-spacing-sm)",
                      borderRadius: "var(--ehr-radius-md)",
                      border: "1px solid var(--ehr-border)",
                      backgroundColor: "var(--ehr-bg-primary)",
                      color: "var(--ehr-text-primary)",
                    }}
                  />
                  <select
                    value={order.status}
                    onChange={(e) => updateOrder(index, "status", e.target.value)}
                    style={{
                      padding: "var(--ehr-spacing-sm)",
                      borderRadius: "var(--ehr-radius-md)",
                      border: "1px solid var(--ehr-border)",
                      backgroundColor: "var(--ehr-bg-primary)",
                      color: "var(--ehr-text-primary)",
                    }}
                  >
                    <option value="Active">Active</option>
                    <option value="Pending">Pending</option>
                    <option value="Completed">Completed</option>
                  </select>
                  <select
                    value={order.priority}
                    onChange={(e) => updateOrder(index, "priority", e.target.value)}
                    style={{
                      padding: "var(--ehr-spacing-sm)",
                      borderRadius: "var(--ehr-radius-md)",
                      border: "1px solid var(--ehr-border)",
                      backgroundColor: "var(--ehr-bg-primary)",
                      color: "var(--ehr-text-primary)",
                    }}
                  >
                    <option value="Routine">Routine</option>
                    <option value="Stat">Stat</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => removeOrder(index)}
                    style={{
                      padding: "var(--ehr-spacing-xs) var(--ehr-spacing-md)",
                      backgroundColor: "var(--ehr-error)",
                      color: "var(--ehr-text-inverse)",
                      border: "none",
                      borderRadius: "var(--ehr-radius-md)",
                      cursor: "pointer",
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
              {orders.length === 0 && (
                <p style={{ color: "var(--ehr-text-secondary)", fontStyle: "italic" }}>
                  No orders added. Click "Add Order" to add one.
                </p>
              )}
            </div>

            {/* Learning Objectives */}
            <div style={{ marginBottom: "var(--ehr-spacing-lg)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--ehr-spacing-md)" }}>
                <h3 style={{ color: "var(--ehr-primary)", margin: 0 }}>
                  Learning Objectives
                </h3>
                <button
                  type="button"
                  onClick={addLearningObjective}
                  className="modal-button secondary"
                  style={{ padding: "var(--ehr-spacing-xs) var(--ehr-spacing-md)" }}
                >
                  + Add Objective
                </button>
              </div>
              {learningObjectives.map((objective, index) => (
                <div key={index} style={{ 
                  display: "flex",
                  gap: "var(--ehr-spacing-md)",
                  marginBottom: "var(--ehr-spacing-md)"
                }}>
                  <input
                    type="text"
                    value={objective}
                    onChange={(e) => updateLearningObjective(index, e.target.value)}
                    placeholder="e.g., Assess and monitor patient vital signs"
                    style={{
                      flex: 1,
                      padding: "var(--ehr-spacing-sm)",
                      borderRadius: "var(--ehr-radius-md)",
                      border: "1px solid var(--ehr-border)",
                      backgroundColor: "var(--ehr-bg-primary)",
                      color: "var(--ehr-text-primary)",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => removeLearningObjective(index)}
                    style={{
                      padding: "var(--ehr-spacing-xs) var(--ehr-spacing-md)",
                      backgroundColor: "var(--ehr-error)",
                      color: "var(--ehr-text-inverse)",
                      border: "none",
                      borderRadius: "var(--ehr-radius-md)",
                      cursor: "pointer",
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            {/* Tags */}
            <div style={{ marginBottom: "var(--ehr-spacing-lg)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--ehr-spacing-md)" }}>
                <h3 style={{ color: "var(--ehr-primary)", margin: 0 }}>
                  Tags
                </h3>
                <button
                  type="button"
                  onClick={addTag}
                  className="modal-button secondary"
                  style={{ padding: "var(--ehr-spacing-xs) var(--ehr-spacing-md)" }}
                >
                  + Add Tag
                </button>
              </div>
              {tags.map((tag, index) => (
                <div key={index} style={{ 
                  display: "flex",
                  gap: "var(--ehr-spacing-md)",
                  marginBottom: "var(--ehr-spacing-md)"
                }}>
                  <input
                    type="text"
                    value={tag}
                    onChange={(e) => updateTag(index, e.target.value)}
                    placeholder="e.g., Hypertension, Cardiovascular"
                    style={{
                      flex: 1,
                      padding: "var(--ehr-spacing-sm)",
                      borderRadius: "var(--ehr-radius-md)",
                      border: "1px solid var(--ehr-border)",
                      backgroundColor: "var(--ehr-bg-primary)",
                      color: "var(--ehr-text-primary)",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => removeTag(index)}
                    style={{
                      padding: "var(--ehr-spacing-xs) var(--ehr-spacing-md)",
                      backgroundColor: "var(--ehr-error)",
                      color: "var(--ehr-text-inverse)",
                      border: "none",
                      borderRadius: "var(--ehr-radius-md)",
                      cursor: "pointer",
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
              {tags.length === 0 && (
                <p style={{ color: "var(--ehr-text-secondary)", fontStyle: "italic" }}>
                  No tags added. Primary diagnosis will be used as default tag.
                </p>
              )}
            </div>

            {/* Simulation Parameters */}
            <div style={{ marginBottom: "var(--ehr-spacing-lg)" }}>
              <h3 style={{ color: "var(--ehr-primary)", marginBottom: "var(--ehr-spacing-md)" }}>
                Simulation Parameters
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "var(--ehr-spacing-md)" }}>
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "var(--ehr-spacing-sm)",
                      color: "var(--ehr-text-primary)",
                      fontWeight: 500,
                    }}
                  >
                    Tick Interval (ms)
                  </label>
                  <input
                    type="number"
                    value={tickInterval}
                    onChange={(event) => setTickInterval(event.target.value)}
                    placeholder="5000"
                    min="1000"
                    max="60000"
                    style={{
                      width: "100%",
                      padding: "var(--ehr-spacing-sm)",
                      borderRadius: "var(--ehr-radius-md)",
                      border: "1px solid var(--ehr-border)",
                      backgroundColor: "var(--ehr-bg-primary)",
                      color: "var(--ehr-text-primary)",
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "var(--ehr-spacing-sm)",
                      color: "var(--ehr-text-primary)",
                      fontWeight: 500,
                    }}
                  >
                    Target Systolic BP (optional)
                  </label>
                  <input
                    type="number"
                    value={targetSystolic}
                    onChange={(event) => setTargetSystolic(event.target.value)}
                    placeholder="e.g., 145"
                    min="90"
                    max="200"
                    style={{
                      width: "100%",
                      padding: "var(--ehr-spacing-sm)",
                      borderRadius: "var(--ehr-radius-md)",
                      border: "1px solid var(--ehr-border)",
                      backgroundColor: "var(--ehr-bg-primary)",
                      color: "var(--ehr-text-primary)",
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "var(--ehr-spacing-sm)",
                      color: "var(--ehr-text-primary)",
                      fontWeight: 500,
                    }}
                  >
                    Target Diastolic BP (optional)
                  </label>
                  <input
                    type="number"
                    value={targetDiastolic}
                    onChange={(event) => setTargetDiastolic(event.target.value)}
                    placeholder="e.g., 90"
                    min="50"
                    max="120"
                    style={{
                      width: "100%",
                      padding: "var(--ehr-spacing-sm)",
                      borderRadius: "var(--ehr-radius-md)",
                      border: "1px solid var(--ehr-border)",
                      backgroundColor: "var(--ehr-bg-primary)",
                      color: "var(--ehr-text-primary)",
                    }}
                  />
                </div>
              </div>
              {targetSystolic && targetDiastolic && (
                <div style={{ marginTop: "var(--ehr-spacing-md)" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "var(--ehr-spacing-sm)",
                      color: "var(--ehr-text-primary)",
                      fontWeight: 500,
                    }}
                  >
                    Hold Ticks Required
                  </label>
                  <input
                    type="number"
                    value={holdTicks}
                    onChange={(event) => setHoldTicks(event.target.value)}
                    placeholder="3"
                    min="1"
                    max="10"
                    style={{
                      width: "100%",
                      padding: "var(--ehr-spacing-sm)",
                      borderRadius: "var(--ehr-radius-md)",
                      border: "1px solid var(--ehr-border)",
                      backgroundColor: "var(--ehr-bg-primary)",
                      color: "var(--ehr-text-primary)",
                    }}
                  />
                </div>
              )}
            </div>

            {/* Scenario Metadata */}
            <div style={{ marginBottom: "var(--ehr-spacing-lg)" }}>
              <h3 style={{ color: "var(--ehr-primary)", marginBottom: "var(--ehr-spacing-md)" }}>
                Scenario Metadata
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "var(--ehr-spacing-md)" }}>
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "var(--ehr-spacing-sm)",
                      color: "var(--ehr-text-primary)",
                      fontWeight: 500,
                    }}
                  >
                    Difficulty
                  </label>
                  <select
                    value={difficulty}
                    onChange={(event) => setDifficulty(event.target.value)}
                    style={{
                      width: "100%",
                      padding: "var(--ehr-spacing-sm)",
                      borderRadius: "var(--ehr-radius-md)",
                      border: "1px solid var(--ehr-border)",
                      backgroundColor: "var(--ehr-bg-primary)",
                      color: "var(--ehr-text-primary)",
                    }}
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "var(--ehr-spacing-sm)",
                      color: "var(--ehr-text-primary)",
                      fontWeight: 500,
                    }}
                  >
                    Estimated Duration
                  </label>
                  <input
                    type="text"
                    value={estimatedDuration}
                    onChange={(event) => setEstimatedDuration(event.target.value)}
                    placeholder="e.g., 30-45 minutes"
                    style={{
                      width: "100%",
                      padding: "var(--ehr-spacing-sm)",
                      borderRadius: "var(--ehr-radius-md)",
                      border: "1px solid var(--ehr-border)",
                      backgroundColor: "var(--ehr-bg-primary)",
                      color: "var(--ehr-text-primary)",
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "var(--ehr-spacing-sm)",
                      color: "var(--ehr-text-primary)",
                      fontWeight: 500,
                    }}
                  >
                    Specialty
                  </label>
                  <input
                    type="text"
                    value={specialty}
                    onChange={(event) => setSpecialty(event.target.value)}
                    placeholder="e.g., Medical-Surgical Nursing"
                    style={{
                      width: "100%",
                      padding: "var(--ehr-spacing-sm)",
                      borderRadius: "var(--ehr-radius-md)",
                      border: "1px solid var(--ehr-border)",
                      backgroundColor: "var(--ehr-bg-primary)",
                      color: "var(--ehr-text-primary)",
                    }}
                  />
                </div>
              </div>
            </div>

            {message && (
              <div
                style={{
                  padding: "var(--ehr-spacing-md)",
                  borderRadius: "var(--ehr-radius-md)",
                  backgroundColor: isSuccessMessage
                    ? "rgba(16, 185, 129, 0.1)"
                    : "rgba(239, 68, 68, 0.1)",
                  color: isSuccessMessage
                    ? "var(--ehr-success)"
                    : "var(--ehr-error)",
                  marginBottom: "var(--ehr-spacing-md)",
                }}
              >
                {message}
              </div>
            )}
          </form>
        </div>

        <div className="modal-footer">
          <div className="modal-actions">
            <button className="modal-button secondary" onClick={onClose} type="button">
              Cancel
            </button>
            <button
              className="modal-button primary"
              onClick={handleSubmit}
              disabled={isLoading}
              type="button"
            >
              {isLoading ? "Creating..." : "Create Scenario"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreateScenarioModal;
