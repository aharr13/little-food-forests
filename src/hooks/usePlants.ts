// src/hooks/usePlants.ts
import { useState, useEffect, useMemo } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Plant, GuildFunction } from '../types';

interface UsePlantsOptions {
  layerFilter?: string;
  searchQuery?: string;
  guildFilter?: GuildFunction[];
}

interface UsePlantsResult {
  plants: Plant[];
  loading: boolean;
  error: string | null;
  filteredPlants: Plant[];
}

export function usePlants(options: UsePlantsOptions = {}): UsePlantsResult {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { layerFilter, searchQuery, guildFilter } = options;

  useEffect(() => {
    loadPlants();
  }, []);

  async function loadPlants() {
    try {
      setLoading(true);
      const plantsRef = collection(db, 'plants');
      const snapshot = await getDocs(plantsRef);

      const loadedPlants = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as Plant[];

      // Sort by common name
      loadedPlants.sort((a, b) => a.commonName.localeCompare(b.commonName));

      setPlants(loadedPlants);
      setError(null);
    } catch (err) {
      console.error('Error loading plants:', err);
      setError('Failed to load plants');
    } finally {
      setLoading(false);
    }
  }

  const filteredPlants = useMemo(() => {
    let result = plants;

    // Filter by layer
    if (layerFilter) {
      result = result.filter(plant =>
        plant.layerTypes.includes(layerFilter)
      );
    }

    // Filter by search query
    if (searchQuery && searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(plant =>
        plant.commonName.toLowerCase().includes(query) ||
        plant.scientificName.toLowerCase().includes(query) ||
        plant.description.toLowerCase().includes(query)
      );
    }

    // Filter by guild functions
    if (guildFilter && guildFilter.length > 0) {
      result = result.filter(plant =>
        guildFilter.some(func => plant.guildFunctions.includes(func))
      );
    }

    return result;
  }, [plants, layerFilter, searchQuery, guildFilter]);

  return {
    plants,
    loading,
    error,
    filteredPlants,
  };
}
