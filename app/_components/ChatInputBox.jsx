import { Button } from "@/components/ui/button";
import { Mic, Paperclip, Send } from "lucide-react";
import React, { useContext, useEffect, useState } from "react";
import AiMultiModels from "./AiMultiModels";
import { AiSelectedModelContext } from "@/shared/context/AiSelectedModelContext";
import axios from "axios";

const ChatInputBox = () => {
  const [userInput, setUserInput] = useState();
  const { messages, setMessages, aiSelectedModels, setAiSelectedModels } =
    useContext(AiSelectedModelContext);

  const handleSend = async () => {
    if (!userInput.trim()) return;

    //add user message to all enabled models
    setMessages((prev) => {
      const updated = { ...prev };
      Object.keys(aiSelectedModels).forEach((modelKey) => {
        // if(aiSelectedModels[modelKey].enable){
        updated[modelKey] = [
          ...(updated[modelKey] ?? []),
          { role: "user", content: userInput },
        ];
        // }
      });
      return updated;
    });
    const currentInput = userInput;
    setUserInput("");
    //Fetch response from each enabled model
    Object.entries(aiSelectedModels).forEach(
      async ([parentModel, modelInfo]) => {
        if (!modelInfo.modelId || aiSelectedModels[parentModel].enable == false)
          return;

        setMessages((prev) => ({
          ...prev,
          [parentModel]: [
            ...(prev[parentModel] ?? []),
            {
              role: "assistant",
              content: "Thinking...",
              model: parentModel,
              loading: true,
            },
          ],
        }));
        try {
          const result = await axios.post("/api/ai-multi-model", {
            model: modelInfo.modelId,
            msg: [{ role: "user", content: currentInput }],
            parentModel,
          });
          const { aiResponse, model } = result.data;
          setMessages((prev) => {
            const updated = [...(prev[parentModel] ?? [])];
            const loadingIndex = updated.findIndex((m) => m.loading);

            if (loadingIndex !== -1) {
              updated[loadingIndex] = {
                role: "assistant",
                content: aiResponse,
                model,
                loading: false,
              };
            } else {
              // fallback if no loading msg found
              updated.push({
                role: "assistant",
                content: aiResponse,
                model,
                loading: false,
              });
            }
            return { ...prev, [parentModel]: updated };
          });
        } catch (error) {
          console.log(error);
          setMessages((prev) => ({
            ...prev,
            [parentModel]: [
              ...(prev[parentModel] ?? []),
              { role: "assistant", content: "Error Fetching Response" },
            ],
          }));
        }
      }
    );
  };
  useEffect(() => {
    console.log(messages);
  }, [messages]);

  return (
    <div className="relative min-h-screen">
      {/* page content */}
      <div>
        <AiMultiModels />
      </div>
      {/* fixed chat input */}
      <div className="fixed bottom-0  flex left-0 w-full justify-center px-4 pb-4">
        <div className="w-full border rounded-xl shadow-md max-w-2xl p-4">
          <input
            type="textarea"
            placeholder="Ask me anything"
            className="border-0 outline-none w-full"
            value={userInput}
            onChange={(event) => setUserInput(event.target.value)}
          />
          <div className="mt-3 flex justify-between items-center">
            <Button variant={"ghost"} size={"icon"}>
              <Paperclip className="h-5 w-5" />
            </Button>
            <div className="flex gap-5">
              <Button variant={"ghost"} size={"icon"}>
                <Mic />{" "}
              </Button>
              <Button
                variant={""}
                size={"icon"}
                className={"bg-purple-600"}
                onClick={handleSend}
              >
                <Send />{" "}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInputBox;
