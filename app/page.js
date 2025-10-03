
"use client"

import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import Image from "next/image";
import ChatInputBox from "./_components/ChatInputBox";
import { Suspense } from "react";

export default function Home() {
  const {setTheme} = useTheme()
  return (
    <Suspense fallback={<div>Loading chat...</div>}>
      <ChatInputBox />
    </Suspense>

  );
}
