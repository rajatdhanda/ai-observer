// This file has intentional errors for testing

// ERROR: Creating new interface instead of importing
interface User {
    id: string;
    name: string;
    email: string;
  }
  
  // ERROR: Wrong type for photos
  interface DailyLog {
    id: string;
    photos: string; // Should be string[]
    meals: {
      breakfast: string;
      lunch: string;
      snack: string;
    };
  }
  
  export function ExampleComponent({ user }: { user: User }) {
    return null;
  }