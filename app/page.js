
"use client"

import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import Image from "next/image";

export default function Home() {
  const {setTheme} = useTheme()
  return (
    <div>
      <h3 className="text-red-600">Hellow bhai log</h3>
      <Button>button </Button>
      <Button onClick={()=>setTheme('dark')}>DarkMode</Button>
      <Button onClick={()=>setTheme('light')}>LightMode</Button>

    </div>
  );
}
