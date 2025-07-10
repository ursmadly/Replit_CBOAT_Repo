import { db } from "./db";
import { users } from "@shared/schema";

/**
 * Initialize user accounts in the database
 * This function creates default user accounts for the application
 */
export async function initUsers() {
  console.log('Initializing user accounts...');
  
  try {
    // Check if users already exist
    const existingUsers = await db.select().from(users);
    
    if (existingUsers.length > 0) {
      console.log(`${existingUsers.length} users already exist in the database, skipping initialization`);
      return;
    }
    
    // Sample user data from Admin.tsx
    const sampleUsers = [
      {
        username: "nivaasgd",
        fullName: "Nivaas Damotharan",
        email: "nivaasg@hexaware.com",
        role: "Medical Monitor",
        password: "12345", // Default password
        status: "active",
        studyAccess: ["ABC-123", "XYZ-789"]
      },
      {
        username: "madhu",
        fullName: "Madhu",
        email: "orugantir@hexaware.com",
        role: "System Administrator",
        password: "12345", // Default password
        status: "active",
        studyAccess: ["All Studies"]
      },
      {
        username: "johndoe",
        fullName: "John Doe",
        email: "john.doe@example.com",
        role: "System Administrator",
        password: "12345", // Default password
        status: "active",
        studyAccess: ["All Studies"]
      },
      {
        username: "janedoe",
        fullName: "Jane Doe",
        email: "jane.doe@example.com",
        role: "Data Manager",
        password: "12345", // Default password
        status: "active",
        studyAccess: ["All Studies"]
      },
      {
        username: "bobsmith",
        fullName: "Bob Smith",
        email: "bob.smith@example.com",
        role: "Clinical Operations Manager",
        password: "12345", // Default password
        status: "active",
        studyAccess: ["ABC-123", "DEF-456"]
      },
      {
        username: "sarahjones",
        fullName: "Sarah Jones",
        email: "sarah.jones@example.com",
        role: "Clinical Research Associate",
        password: "12345", // Default password
        status: "active",
        studyAccess: ["ABC-123", "XYZ-789"]
      },
      {
        username: "mikebrown",
        fullName: "Mike Brown",
        email: "mike.brown@example.com",
        role: "Biostatistician",
        password: "12345", // Default password
        status: "active",
        studyAccess: ["ABC-123", "DEF-456", "XYZ-789"]
      },
      {
        username: "amylee",
        fullName: "Amy Lee",
        email: "amy.lee@example.com",
        role: "Data Manager",
        password: "12345", // Default password
        status: "active",
        studyAccess: ["All Studies"]
      },
      {
        username: "tomwilson",
        fullName: "Tom Wilson",
        email: "tom.wilson@example.com",
        role: "Safety Specialist",
        password: "12345", // Default password
        status: "active",
        studyAccess: ["ABC-123", "XYZ-789"]
      },
      {
        username: "jenniferclark",
        fullName: "Jennifer Clark",
        email: "jennifer.clark@example.com",
        role: "Regulatory Affairs",
        password: "12345", // Default password
        status: "active",
        studyAccess: ["DEF-456", "XYZ-789"]
      }
    ];
    
    // Insert users into the database
    const insertPromises = sampleUsers.map(user => 
      db.insert(users).values({
        username: user.username,
        password: user.password,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        status: user.status as 'active' | 'inactive' | 'locked',
        studyAccess: user.studyAccess,
        createdAt: new Date(),
        updatedAt: new Date()
      })
    );
    
    await Promise.all(insertPromises);
    console.log(`Successfully inserted ${sampleUsers.length} users into the database`);
  } catch (error) {
    console.error('Error initializing users:', error);
  }
}