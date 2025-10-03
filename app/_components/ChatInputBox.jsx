"use client";

import { Button } from "@/components/ui/button";
import { Mic, Paperclip, Send } from "lucide-react";
import React, { useContext, useState } from "react";
import { AiSelectedModelContext } from "@/shared/context/AiSelectedModelContext";
import axios from "axios";

const ChatInputBox = () => {
  const [userInput, setUserInput] = useState("");
  const { messages, setMessages, aiSelectedModels } = useContext(AiSelectedModelContext);

  const handleSend = async () => {
    if (!userInput.trim()) return;

    const currentInput = userInput;
    setUserInput("");

    // Add user message to all enabled models
    Object.entries(aiSelectedModels).forEach(([parentModel, modelInfo]) => {
      if (!modelInfo.enable) return;

      setMessages((prev) => ({
        ...prev,
        [parentModel]: [
          ...(prev[parentModel] ?? []),
          { role: "user", content: currentInput },
        ],
      }));

      // Add placeholder "Thinking..." message
      setMessages((prev) => ({
        ...prev,
        [parentModel]: [
          ...(prev[parentModel] ?? []),
          { role: "assistant", content: "Thinking...", loading: true },
        ],
      }));

      // Call API for AI response
      axios
        .post("/api/ai-multi-model", {
          model: modelInfo.modelId,
          msg: [{ role: "user", content: currentInput }],
          parentModel,
        })
        .then((res) => {
          const { aiResponse } = res.data;

          setMessages((prev) => {
            const updated = [...(prev[parentModel] ?? [])];
            const loadingIndex = updated.findIndex((m) => m.loading);

            if (loadingIndex !== -1) {
              updated[loadingIndex] = { role: "assistant", content: aiResponse };
            } else {
              updated.push({ role: "assistant", content: aiResponse });
            }

            return { ...prev, [parentModel]: updated };
          });
        })
        .catch((err) => {
          console.error(err);
          setMessages((prev) => ({
            ...prev,
            [parentModel]: [
              ...(prev[parentModel] ?? []),
              { role: "assistant", content: "Error Fetching Response" },
            ],
          }));
        });
    });
  };

  return (
    <div className="fixed bottom-0 w-full p-4 flex justify-center">
      <div className="max-w-2xl w-full border rounded-xl p-4 shadow-md">
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Ask me anything..."
          className="w-full outline-none border-0"
        />
        <div className="flex justify-end gap-2 mt-2">
          <Button size="icon" onClick={handleSend}>
            <Send />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatInputBox;
