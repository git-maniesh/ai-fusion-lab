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
  const { messages, setMessages, aiSelectedModels } = useContext(AiSelectedModelContext);
  const { user } = useUser();
  const [chatId, setChatId] = useState(() => uuidv4());
  const params = useSearchParams();

  // Load chat from URL or create new
  useEffect(() => {
    const chatIdFromParams = params.get("chatId");
    if (chatIdFromParams) {
      setChatId(chatIdFromParams);
      loadMessages(chatIdFromParams);
    } else {
      setMessages({});
      setChatId(uuidv4());
    }
  }, [params]);

  const loadMessages = async (id) => {
    try {
      const docRef = doc(db, "chatHistorY", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setMessages(data.messages || {});
      } else {
        setMessages({});
      }
    } catch (err) {
      console.error("Error fetching chat:", err);
    }
  };

  const handleSend = async () => {
    if (!userInput.trim()) return;

    // Check free token limit
    if (!has({ plan: "unlimited_plan" })) {
      try {
        const result = await axios.post("/api/user-remaining-msg", { token: 1 });
        const remainingToken = result?.data?.remainingToken;
        if (remainingToken <= 0) {
          toast.error("Maximum Daily Limit Exceeded");
          return;
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to check remaining tokens");
        return;
      }
    }

    const currentInput = userInput;
    setUserInput("");

    // Add user message to all enabled models
    setMessages((prev) => {
      const updated = { ...prev };
      Object.keys(aiSelectedModels).forEach((modelKey) => {
        if (aiSelectedModels[modelKey].enable) {
          updated[modelKey] = [
            ...(updated[modelKey] || []),
            { role: "user", content: currentInput },
          ];
        }
      });
      return updated;
    });

    // Fetch AI response for each enabled model
    Object.entries(aiSelectedModels).forEach(async ([parentModel, modelInfo]) => {
      if (!modelInfo.enable || !modelInfo.modelId) return;

      // Add "Thinking..." placeholder
      setMessages((prev) => ({
        ...prev,
        [parentModel]: [
          ...(prev[parentModel] || []),
          { role: "assistant", content: "Thinking...", model: parentModel, loading: true },
        ],
      }));

      try {
        const response = await axios.post("/api/ai-multi-model", {
          model: modelInfo.modelId,
          msg: [{ role: "user", content: currentInput }],
          parentModel,
        });

        const { aiResponse, model } = response.data;

        setMessages((prev) => {
          const updated = [...(prev[parentModel] || [])];
          const loadingIndex = updated.findIndex((m) => m.loading);

          if (loadingIndex !== -1) {
            updated[loadingIndex] = { role: "assistant", content: aiResponse, model, loading: false };
          } else {
            updated.push({ role: "assistant", content: aiResponse, model, loading: false });
          }

          return { ...prev, [parentModel]: updated };
        });
      } catch (err) {
        console.error(err);
        setMessages((prev) => ({
          ...prev,
          [parentModel]: [
            ...(prev[parentModel] || []),
            { role: "assistant", content: "Error Fetching Response", model: parentModel },
          ],
        }));
      }
    });
  };

  // Save messages to Firestore on update
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

      {/* Chat input fixed at bottom */}
      <div className="fixed bottom-0 left-0 w-full flex justify-center px-4 pb-4">
        <div className="w-full max-w-2xl p-4 border rounded-xl shadow-md">
          <input
            type="text"
            placeholder="Ask me anything"
            className="w-full border-0 outline-none"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
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
