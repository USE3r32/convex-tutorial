import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

export const useClearDatabase = () => {
  const clearDatabase = useMutation(api.clearDatabase.clearAllTables);
  
  return async () => {
    try {
      await clearDatabase();
      console.log("Database cleared successfully!");
      // Reload the page to reset the app state
      window.location.reload();
    } catch (error) {
      console.error("Failed to clear database:", error);
    }
  };
};