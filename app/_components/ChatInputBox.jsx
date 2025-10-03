"use client";

import { Button } from "@/components/ui/button";
import { Mic, Paperclip, Send } from "lucide-react";
import React, { useContext, useEffect, useState } from "react";
import AiMultiModels from "./AiMultiModels";
import { AiSelectedModelContext } from "@/shared/context/AiSelectedModelContext";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/config/FirebaseConfig";
import { useAuth, useUser } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

const ChatInputBox = () => {
  const [userInput, setUserInput] = useState("");
  const { has } = useAuth();
  const { user } = useUser();
  const params = useSearchParams();

  const { messages, setMessages, aiSelectedModels } =
    useContext(AiSelectedModelContext);

  const [chatId, setChatId] = useState(() => uuidv4());

  // Load chat messages based on URL chatId
  useEffect(() => {
    const chatIdFromParams = params.get("chatId");
    if (chatIdFromParams) {
      setChatId(chatIdFromParams);
      fetchMessages(chatIdFromParams);
    } else {
      setMessages({});
      setChatId(uuidv4());
    }
  }, [params]);

  const fetchMessages = async (id) => {
    try {
      const docRef = doc(db, "chatHistorY", id);
      const docSnap = await getDoc(docRef);
      const docData = docSnap.data();
      if (docData?.messages) setMessages(docData.messages);
    } catch (err) {
      console.error("Error fetching messages:", err);
    }
  };

  const handleSend = async () => {
    if (!userInput.trim()) return;

    // Token limit check for free users
    if (!has({ plan: "unlimited_plan" })) {
      try {
        const res = await axios.post("/api/user-remaining-msg", { token: 1 });
        if (res.data.remainingToken <= 0) {
          toast.error("Maximum Daily Limit Exceeded");
          return;
        }
      } catch (err) {
        console.error("Token check failed:", err);
      }
    }

    const inputMessage = userInput;
    setUserInput("");

    // Add user message to all enabled models
    setMessages((prev) => {
      const updated = { ...prev };
      Object.keys(aiSelectedModels).forEach((modelKey) => {
        if (aiSelectedModels[modelKey].enable) {
          updated[modelKey] = [
            ...(updated[modelKey] ?? []),
            { role: "user", content: inputMessage },
          ];
        }
      });
      return updated;
    });

    // Send message to all enabled AI models
    Object.entries(aiSelectedModels).forEach(async ([modelKey, modelInfo]) => {
      if (!modelInfo.modelId || !modelInfo.enable) return;

      // Add "Thinking..." placeholder
      setMessages((prev) => ({
        ...prev,
        [modelKey]: [
          ...(prev[modelKey] ?? []),
          { role: "assistant", content: "Thinking...", loading: true },
        ],
      }));

      try {
        const res = await axios.post("/api/ai-multi-model", {
          model: modelInfo.modelId,
          msg: [{ role: "user", content: inputMessage }],
          parentModel: modelKey,
        });

        const aiResponse = res.data.aiResponse || "Error fetching response";

        // Replace "Thinking..." with actual AI response
        setMessages((prev) => {
          const updated = [...(prev[modelKey] ?? [])];
          const index = updated.findIndex((m) => m.loading);
          if (index !== -1) {
            updated[index] = { role: "assistant", content: aiResponse };
          } else {
            updated.push({ role: "assistant", content: aiResponse });
          }
          return { ...prev, [modelKey]: updated };
        });
      } catch (err) {
        console.error(err);
        setMessages((prev) => {
          const updated = [...(prev[modelKey] ?? [])];
          const index = updated.findIndex((m) => m.loading);
          if (index !== -1) {
            updated[index] = { role: "assistant", content: "Error fetching response" };
          } else {
            updated.push({ role: "assistant", content: "Error fetching response" });
          }
          return { ...prev, [modelKey]: updated };
        });
      }
    });
  };

  // Save messages to Firestore whenever messages or chatId changes
  useEffect(() => {
    if (!chatId || !messages) return;

    const saveMessages = async () => {
      try {
        await setDoc(doc(db, "chatHistorY", chatId), {
          chatId,
          userEmail:
            user?.primaryEmailAddress?.emailAddress ||
            user?.emailAddresses?.[0]?.emailAddress ||
            "",
          messages,
          lastUpdated: Date.now(),
        });
      } catch (err) {
        console.error("Error saving messages:", err);
      }
    };
    saveMessages();
  }, [messages, chatId]);

  return (
    <div className="relative min-h-screen">
      {/* Chat Messages */}
      <div className="p-4">
        <AiMultiModels />
      </div>

      {/* Input box */}
      <div className="fixed bottom-0 flex left-0 w-full justify-center px-4 pb-4">
        <div className="w-full border rounded-xl shadow-md max-w-2xl p-4 flex items-center gap-2">
          <input
            type="text"
            placeholder="Ask me anything"
            className="border-0 outline-none flex-1"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
          />
          <Button size="icon" onClick={handleSend}>
            <Send />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatInputBox;
