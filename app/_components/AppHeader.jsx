import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import React from "react";

const AppHeader = () => {
  return (
    <div className="p-3 w-full shadow flex justify-between items-center">
      <SidebarTrigger />
    </div>
  );
};

export default AppHeader;
