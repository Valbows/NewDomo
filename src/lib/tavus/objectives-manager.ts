interface ObjectivesManager {
  getObjectives: () => Promise<string[]>;
  setObjectives: (objectives: string[]) => Promise<void>;
}

export const createObjectivesManager = (config?: any): ObjectivesManager => {
  return {
    getObjectives: async () => {
      // Implementation would fetch from Tavus API
      return [];
    },
    setObjectives: async (objectives: string[]) => {
      // Implementation would update Tavus API
    },
  };
};