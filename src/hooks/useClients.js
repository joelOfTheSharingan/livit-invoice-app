import { useState, useEffect, useCallback } from "react";
import { fetchClients, createClient } from "../services/clientService.js";

export function useClients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadClients = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchClients();
      setClients(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  const addClient = useCallback(async (clientData) => {
    const newClient = await createClient(clientData);
    setClients((prev) => [...prev, newClient]);
    return newClient;
  }, []);

  return { clients, loading, error, loadClients, addClient };
}
