import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { User } from "@/lib/api/auth"; // Import the User type

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean; // Derived state, but useful to store explicitly
  setAuth: (token: string, user: User) => void;
  clearAuth: () => void;
  // Optional: Add an action to rehydrate/check auth on load if needed
  // checkAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,

      setAuth: (token, user) => {
        set({ token, user, isAuthenticated: true });
        console.log("Auth state set:", { token, user });
        // Optionally trigger side effects here, like configuring axios headers
        // (though interceptors are generally better for that)
      },

      clearAuth: () => {
        set({ token: null, user: null, isAuthenticated: false });
        console.log("Auth state cleared.");
        // Optionally trigger side effects like redirecting to login
      },

      // Example checkAuth implementation (call this on app load)
      // checkAuth: () => {
      //   const token = get().token;
      //   if (token) {
      //     // TODO: Add token validation logic here (e.g., check expiry, call a /me endpoint)
      //     // For now, just assume token presence means authenticated
      //     if (!get().isAuthenticated) {
      //        console.log("Rehydrating auth state from persisted token.");
      //        set({ isAuthenticated: true }); // Ensure isAuthenticated is true if token exists
      //     }
      //   } else {
      //     // Ensure state is cleared if no token found on check
      //     if (get().isAuthenticated) {
      //        set({ token: null, user: null, isAuthenticated: false });
      //     }
      //   }
      // }
    }),
    {
      name: "auth-storage", // Name of the item in storage (must be unique)
      storage: createJSONStorage(() => localStorage), // Use localStorage
      partialize: (state) => ({ token: state.token, user: state.user }), // Only persist token and user
      // Optional: onRehydrate callback if needed
      // onRehydrateStorage: (state) => {
      //   console.log("Hydration finished.");
      //   return (state, error) => {
      //     if (error) {
      //       console.error("An error happened during hydration", error);
      //     } else {
      //       // Call checkAuth after rehydration is complete
      //       useAuthStore.getState().checkAuth();
      //     }
      //   };
      // },
    }
  )
);

// Optional: Call checkAuth on initial load outside the component lifecycle
// This ensures the isAuthenticated flag is correctly set based on persisted storage
// Note: This might run too early in some SSR/Next.js scenarios.
// Consider calling checkAuth within a top-level layout component's useEffect.
// useAuthStore.getState().checkAuth();
