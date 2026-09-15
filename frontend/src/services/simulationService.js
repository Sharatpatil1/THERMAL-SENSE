import { api } from './api';

export async function getMaterials() {
  return await api.get('/materials');
}

export async function runSimulation({ shelter, materials, weatherHourly }) {
  return await api.post('/simulate', {
    shelter,
    materials,
    weatherHourly
  });
}

export async function runOptimization({ baseShelter, weatherHourly, targetObjective }) {
  return await api.post('/optimize', {
    baseShelter,
    weatherHourly,
    targetObjective
  });
}

export async function saveSimulationRecord(payload) {
  return await api.post('/simulations/save', payload);
}

export async function listSavedSimulations() {
  return await api.get('/simulations');
}

export async function getSimulationDetails(id) {
  return await api.get(`/simulations/${id}`);
}
