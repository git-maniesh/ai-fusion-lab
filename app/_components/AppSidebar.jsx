"use client";

import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { SignInButton, useAuth, useUser } from "@clerk/nextjs";
import { Moon, Sun, User2, Zap } from "lucide-react";
import { useTheme } from "next-themes";
import UsageCreditProgress from "./UsageCreditProgress";
import { collection, getDocs, query, where, getDoc, doc } from "firebase/firestore";
import { useEffect, useState, useContext } from "react";
import moment from "moment";
import Link from "next/link";
import { db } from "@/config/FirebaseConfig";
import axios from "axios";
import { AiSelectedModelContext } from "@/shared/context/AiSelectedModelContext";
import PricingModal from "./PricingModal";

export function AppSidebar() {
  const { has } = useAuth();
  const { theme, setTheme } = useTheme();
  const { user } = useUser();
  const [chatHistorY, setChatHistorY] = useState([]);
  const [freeMsgCount, setFreeMsgCount] = useState(0);
  const { aiSelectedMedels, setAiSelectedModels, messages } =
    useContext(AiSelectedModelContext);

  useEffect(() => {
    if (user) {
      GetChatHistory();
    }
  }, [user]);

  useEffect(() => {
    GetRemainingTokenMsgs();
  }, [messages]);

  const GetChatHistory = async () => {
    try {
      const q = query(
        collection(db, "chatHistorY"),
        where("userEmail", "==", user?.primaryEmailAddress?.emailAddress)
      );
      const querySnapshot = await getDocs(q);

      const chats = [];
      querySnapshot.forEach((doc) => {
        chats.push(doc.data());
      });

      setChatHistorY(chats);
    } catch (err) {
      console.error("Error fetching chat history:", err);
    }
  };

  // ✅ Function to fetch full chat by chatId
  const GetSingleChat = async (chatId) => {
    try {
      const docRef = doc(db, "chatHistorY", chatId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        console.log("Chat data:", docSnap.data());
        return docSnap.data();
      } else {
        console.log("No such document!");
        return null;
      }
    } catch (err) {
      console.error("Error fetching single chat:", err);
      return null;
    }
  };

  const GetLastUserMessageFromChat = (chats) => {
    if (!chats || !chats.messages) {
      return {
        chatId: chats?.chatId || "",
        message: "No messages yet",
        lastMsgDate: "N/A",
      };
    }

    const allMessages = Object.values(chats.messages).flat();
    const userMessages = allMessages.filter((msg) => msg.role === "user");

    const lastUserMsg =
      userMessages.length > 0
        ? userMessages[userMessages.length - 1].content
        : "No user message";

    const lastUpdated = chats.lastUpdated || Date.now();
    const formattedDate = moment(lastUpdated).fromNow();

    return {
      chatId: chats.chatId,
      message: lastUserMsg,
      lastMsgDate: formattedDate,
    };
  };

  const GetRemainingTokenMsgs = async () => {
    try {
      const result = await axios.post("/api/user-remaining-msg");
      setFreeMsgCount(result.data.remainingToken);
    } catch (err) {
      console.error(
        "Error fetching remaining tokens:",
        err.response?.data || err
      );
    }
  };

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="p-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <img
                src="/logo.svg"
                alt="logo"
                width={60}
                height={60}
                className="w-[40px] h-[40px]"
              />
              <h2 className="font-bold text-2xl">AI Fusion</h2>
            </div>
            <div>
              {theme === "light" ? (
                <Button variant={"ghost"} onClick={() => setTheme("dark")}>
                  <Sun />
                </Button>
              ) : (
                <Button variant={"ghost"} onClick={() => setTheme("light")}>
                  <Moon />
                </Button>
              )}
            </div>
          </div>

          <div>
            {user ? (
              <Link href="/">
                <Button className="mt-7 w-full" size={"lg"}>
                  + New Chat
                </Button>
              </Link>
            ) : (
              <SignInButton>
                <Button className="mt-7 w-full" size={"lg"}>
                  + New Chat
                </Button>
              </SignInButton>
            )}
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <div className="p-3">
            <h2 className="font-bold text-lg">Chat</h2>
            {!user && (
              <p className="text-sm text-gray-400">
                Sign in to start chatting with multiple AI models
              </p>
            )}

            {chatHistorY.map((chat, index) => {
              const chatInfo = GetLastUserMessageFromChat(chat);
              return (
                <div
                  key={index}
                  onClick={async () => {
                    const chatData = await GetSingleChat(chatInfo.chatId);
                    if (chatData) {
                      console.log("Loaded chat:", chatData);
                      // 👉 You could call setMessages(chatData.messages) here if needed
                    }
                  }}
                  className="mt-2 cursor-pointer hover:bg-gray-200 p-3"
                >
                  <h2 className="text-sm text-gray-400">
                    {chatInfo.lastMsgDate}
                  </h2>
                  <h2 className="text-lg line-clamp-1">{chatInfo.message}</h2>
                  <hr className="my-3" />
                </div>
              );
            })}
          </div>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="p-3 mb-10">
          {!user ? (
            <SignInButton mode="modal">
              <Button className={"w-full"} size={"lg"}>
                Sign In / Sign Up
              </Button>
            </SignInButton>
          ) : (
            <div>
              {!has({ plan: "unlimited_plan" }) && (
                <div>
                  <UsageCreditProgress remainingToken={freeMsgCount} />
                  <PricingModal>
                    <Button className={"w-full mb-3"}>
                      <Zap /> Upgrade Plan
                    </Button>
                  </PricingModal>
                </div>
              )}

              <Button className="flex w-full" variant={"ghost"}>
                <User2 /> <h2>Settings</h2>
              </Button>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
