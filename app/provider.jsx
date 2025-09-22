"use client";

import React, { useEffect } from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./_components/AppSidebar";
import AppHeader from "./_components/AppHeader";
import { useUser } from "@clerk/nextjs";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/config/FirebaseConfig";

function Provider({ children, ...props }) {
  const { user } = useUser();
  useEffect(() => {
    console.log("🔥 Firestore db object:", db); // ✅ log db to check if it's initialized

    if (user) {
      console.log("👤 Clerk user object:", user);

      CreateNewUser();
    }
  }, [user]);
  // const CreateNewUser = async () => {
  //   // if user exists?
  //   const userRef = doc(db, "users", user?.primaryEmailAddress?.emailAddress);
  //   const userSnap = await getDoc(userRef);

  //   if (userSnap.exists()) {
  //     console.log("exisiting user");
  //     return;
  //   } else {
  //     const userData = {
  //       name: user?.fullName,
  //       email: user?.primaryEmailAddress.emailAddress,
  //       createdAt: new Date(),
  //       remainingMsg: 5, // only for free users
  //       plan: "Free",
  //       credits: 1000, // paid user
  //     };
  //     await setDoc(userRef, userData);
  //     console.log("new user data saved");
  //   }

  //   // if not then insert
  // };
  // should remove the createnewuser function
  // files with user authentication 
  // layout , appsidebar and providera

  const CreateNewUser = async () => {
    try {
      if (!db) {
        console.error("❌ Firestore db is undefined!");
        return;
      }
      if (!user?.id) {
        console.error("❌ No Clerk user ID found!");
        return;
      }

      // Use Clerk user.id as document ID (safe, unique, no illegal chars)
      // const userRef = doc(db, "users", user.id);
      const userRef = doc(db,"users",user?.primaryEmailAddress?.emailAddress)
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        console.log("✅ Existing user found:", userSnap.data());
        return;
      }

      // Safely extract email
      const email =
        user?.primaryEmailAddress?.emailAddress ||
        user?.emailAddresses?.[0]?.emailAddress ||
        "";

      const userData = {
        name: user?.fullName || "",
        email,
        createdAt: new Date(),
        remainingMsg: 5,
        plan: "Free",
        credits: 1000,
      };

      await setDoc(userRef, userData);
      console.log("✅ New user saved:", userData);
    } catch (error) {
      console.error("🔥 Firestore error:", error);
    }
  };

  return (
    <NextThemesProvider
      {...props}
      attribute={"class"}
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <SidebarProvider>
        <AppSidebar />

        <div className="w-full">
          <AppHeader />
          {children}
        </div>
      </SidebarProvider>
    </NextThemesProvider>
  );
}

export default Provider;
