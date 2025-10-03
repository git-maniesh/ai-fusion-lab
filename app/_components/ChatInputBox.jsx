"use client";

import { Button } from "@/components/ui/button";
import { Mic, Paperclip, Send } from "lucide-react";
import React, { useContext, useEffect, useState } from "react";
import AiMultiModels from "./AiMultiModels";
import { AiSelectedModelContext } from "@/shared/context/AiSelectedModelContext";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "@/config/FirebaseConfig";
import { useAuth, useUser } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

const ChatInputBox = () => {
  const [userInput, setUserInput] = useState("");
  const { has } = useAuth();
  const { messages, setMessages, aiSelectedModels } = useContext(AiSelectedModelContext);
  const { user } = useUser();
  const [chatId, setChatId] = useState(() => uuidv4());
  const params = useSearchParams();

  // Load chat if chatId exists in URL
  useEffect(() => {
    const chatId_ = params.get("chatId");
    if (chatId_) {
      setChatId(chatId_);
      loadMessages(chatId_);
    } else {
      setMessages({});
      setChatId(uuidv4());
    }
  }, [params]);

  const loadMessages = async (chatId) => {
    try {
      const docRef = doc(db, "chatHistorY", chatId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setMessages(docSnap.data().messages || {});
      }
    } catch (err) {
      console.error("Error loading messages:", err);
    }
  };

  const handleSend = async () => {
    if (!userInput.trim()) return;

    // Free plan token check
    if (!has({ plan: "unlimited_plan" })) {
      const result = await axios.post("/api/user-remaining-msg", { token: 1 });
      const remainingToken = result?.data?.remainingToken;
      if (remainingToken <= 0) {
        toast.error("Maximum Daily Limit Exceeded");
        return;
      }
    }

    const currentInput = userInput;
    setUserInput("");

    // Add user message to enabled models
    setMessages((prev) => {
      const updated = { ...prev };
      Object.keys(aiSelectedModels).forEach((modelKey) => {
        if (aiSelectedModels[modelKey]?.enable) {
          updated[modelKey] = [...(updated[modelKey] ?? []), { role: "user", content: currentInput }];
        }
      });
      return updated;
    });

    // Fetch AI response for each enabled model
    Object.entries(aiSelectedModels).forEach(async ([parentModel, modelInfo]) => {
      if (!modelInfo?.modelId || !modelInfo?.enable) return;

      // Add loading message
      setMessages((prev) => ({
        ...prev,
        [parentModel]: [...(prev[parentModel] ?? []), { role: "assistant", content: "Thinking...", loading: true }],
      }));

      try {
        const result = await axios.post("/api/ai-multi-model", {
          model: modelInfo.modelId,
          msg: currentInput, // send as string if API expects string
          parentModel,
        });

        console.log("API response:", result.data);

        const aiResponse = result.data?.aiResponse || result.data?.output || "No response";
        const model = result.data?.model || parentModel;

        setMessages((prev) => {
          const updated = [...(prev[parentModel] ?? [])];
          const loadingIndex = updated.findIndex((m) => m.loading);
          if (loadingIndex !== -1) {
            updated[loadingIndex] = { role: "assistant", content: aiResponse, model, loading: false };
          } else {
            updated.push({ role: "assistant", content: aiResponse, model, loading: false });
          }
          return { ...prev, [parentModel]: updated };
        });
      } catch (err) {
        console.error("Error fetching AI response:", err?.response?.data || err);
        setMessages((prev) => ({
          ...prev,
          [parentModel]: [...(prev[parentModel] ?? []), { role: "assistant", content: "Error Fetching Response" }],
        }));
      }
    });
  };

  // Persist messages to Firestore whenever they update
  useEffect(() => {
    if (chatId && messages) saveMessages();
  }, [messages, chatId]);

  const saveMessages = async () => {
    try {
      const docRef = doc(db, "chatHistorY", chatId);
      await setDoc(docRef, {
        chatId,
        userEmail: user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || "",
        messages,
        lastUpdated: Date.now(),
      });
    } catch (err) {
      console.error("Error saving messages:", err);
    }
  };

  return (
    <div className="relative min-h-screen">
      <div>
        <AiMultiModels />
      </div>

      <div className="fixed bottom-0 flex left-0 w-full justify-center px-4 pb-4">
        <div className="w-full border rounded-xl shadow-md max-w-2xl p-4">
          <input
            type="text"
            placeholder="Ask me anything"
            className="border-0 outline-none w-full"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
          />
          <div className="mt-3 flex justify-between items-center">
            <Button variant="ghost" size="icon">
              <Paperclip className="h-5 w-5" />
            </Button>
            <div className="flex gap-5">
              <Button variant="ghost" size="icon">
                <Mic />
              </Button>
              <Button size="icon" className="bg-purple-600" onClick={handleSend}>
                <Send />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInputBox;
