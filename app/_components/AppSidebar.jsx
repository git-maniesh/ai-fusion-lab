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
import { Bolt, Moon, Sun, User2, Zap } from "lucide-react";
import { useTheme } from "next-themes";
import UsageCreditProgress from "./UsageCreditProgress";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useEffect, useState, useContext } from "react";
import moment from "moment";
import Link from "next/link";
import { db } from "@/config/FirebaseConfig";
import axios from "axios";
import { AiSelectedModelContext } from "@/shared/context/AiSelectedModelContext";
import PricingModal from "./PricingModal";

export function AppSidebar() {
  const { has } = useAuth();
  // const paidUser = has({ plan: "unlimited_plan" });
  const { theme, setTheme } = useTheme();
  const { user } = useUser();
  const [chatHistorY, setChatHistorY] = useState([]);
  const [freeMsgCount, setFreeMsgCount] = useState(0);
  const { aiSelectedMedels, setAiSelectedModels, messages, setMessages } =
    useContext(AiSelectedModelContext);
  useEffect(() => {
    user && GetChatHistory();
    // user && GetRemainingMsgs();
  }, [user]);
  useEffect(() => {
    GetRemainingTokenMsgs();
  }, [messages]);
  const GetChatHistory = async () => {
    const q = query(
      collection(db, "chatHistorY"),
      where("userEmail", "==", user?.primaryEmailAddress?.emailAddress)
    );
    const querySnapshot = await getDocs(q);

    querySnapshot.forEach((doc) => {
      // console.log(doc.id, doc.data());
      setChatHistorY((prev) => [...prev, doc.data()]);
    });
  };
  const GetLastUserMessageFromChat = (chats) => {
    const allMessages = Object.values(chats.messages).flat();
    const userMessages = allMessages.filter((msg) => msg.role == "user");
    const lastUserMsg = userMessages[userMessages.length - 1].content || null;

    const lastUpdated = chats.lastUpdated || Date.now;
    const formattedDate = moment(lastUpdated).fromNow();

    return {
      chatId: chats.chatId,
      message: lastUserMsg,
      lastMsgDate: formattedDate,
    };
  };

  // const GetRemainingTokenMsgs = async () =>{
  //   const result = await axios.post('/api/user-remaining-msg')
  //   setFreeMsgCount(result.data.remainingToken)

  // }

  // import axios from "axios";

  const GetRemainingTokenMsgs = async () => {
    try {
      const result = await axios.post("/api/user-remaining-msg");

      console.log("Remaining:", result.data.remainingToken);
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
          <div className=" flex justify-between items-center">
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
              {theme == "light" ? (
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
            {/* can remove this condition below to bypass authentication */}
            {user ? (
              <Link href="/">
                <Button className="mt-7 w-full " size={"lg"}>
                  + New Chat
                </Button>
              </Link>
            ) : (
              <SignInButton>
                <Button className="mt-7 w-full " size={"lg"}>
                  + New Chat
                </Button>
              </SignInButton>
            )}
            {/* <Button className="mt-7 w-full " size={"lg"}>
                  {" "}
                  + New Chat
                </Button> */}
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <div className="p-3">
            <h2 className="font-bold  text-lg">Chat</h2>
            {!user && (
              <p className="text-sm text-gray-400">
                Sign in to start chatting with multiple AI models
              </p>
            )}
            {chatHistorY.map((chat, index) => {
              <Link
                key={index}
                href={"?chatId=" + chat.chatId}
                className="mt-2 "
              >
                <div className=" hover:bg-gray-200 p-3 cursor-pointer">
                  <h2 className="text-sm text-gray-400">
                    {GetLastUserMessageFromChat(chat).lastMsgDate}
                  </h2>
                  <h2 className="text-lg line-clamp-1">
                    {GetLastUserMessageFromChat(chat).message}
                  </h2>
                  <hr className="my-3" />
                </div>
              </Link>;
            })}
          </div>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="p-3 mb-10">
          {!user ? (
            // can remove this signinButton
            <SignInButton mode="modal">
              <Button className={"w-full"} size={"lg"}>
                Sign In/ Sign Up
              </Button>
            </SignInButton>
          ) : (
            <div>
              {!has({ plan: "unlimited_plan" }) && (
                <div>
                  <UsageCreditProgress remainingToken={GetRemainingTokenMsgs} />

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
