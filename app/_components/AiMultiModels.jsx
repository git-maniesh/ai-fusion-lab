"use client"

import AiModelList from "@/shared/AiModelList";
import Image from "next/image";
import React, { useContext, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, Lock, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SelectGroup, SelectLabel } from "@radix-ui/react-select";
import { AiSelectedModelContext } from "@/shared/context/AiSelectedModelContext";
import { useAuth, useUser } from "@clerk/nextjs";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// safe markdown renderer (prevents crash on large inputs)
const SafeMarkdown = ({ content }) => {
  if (!content) return null;

  let safeContent = content;
  // optional: trim to avoid extreme size
  if (safeContent.length > 10000) {
    safeContent = safeContent.slice(0, 10000) + "\n\n...(truncated)";
  }

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      skipHtml={true} // prevent raw HTML injection
    >
      {safeContent}
    </ReactMarkdown>
  );
};

const AiMultiModels = () => {
  const { user } = useUser();
  const { has } = useAuth(); // Clerk
  const has1 = true; // TODO: replace with real plan check

  const [aiModelList, setAiModelList] = useState(AiModelList);
  const { messages, aiSelectedModels, setAiSelectedModels } =
    useContext(AiSelectedModelContext);

  const onToggleChange = (model, value) => {
    setAiModelList((prev) =>
      prev.map((m) => (m.model === model ? { ...m, enable: value } : m))
    );
    setAiSelectedModels((prev) => ({
      ...prev,
      [model]: {
        ...(prev?.[model] ?? {}),
        enable: value,
      },
    }));
  };

  const onSelectedValue = (parentModel, value) => {
    setAiSelectedModels((prev) => ({
      ...prev,
      [parentModel]: {
        ...prev[parentModel],
        modelId: value,
      },
    }));
  };

  return (
    <div className="flex flex-1 h-[75vh] border-b">
      {aiModelList.map((model, index) => (
        <div
          key={index}
          className={`flex flex-col border-r h-full overflow-auto ${
            model.enable ? "flex-1 min-w-[400px]" : "min-w-[100px] flex-none"
          }`}
        >
          {/* Header */}
          <div className="flex w-full h-[70px] items-center justify-between border-b p-4">
            <div className="flex items-center gap-4">
              <Image src={model.icon} alt={model.model} width={24} height={24} />

              {model.enable && (
                <Select
                  defaultValue={aiSelectedModels[model.model]?.modelId}
                  onValueChange={(value) => onSelectedValue(model.model, value)}
                  disabled={model.premium && !has1}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue
                      placeholder={
                        aiSelectedModels[model.model]?.modelId || "Select model"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup className="px-3">
                      <SelectLabel>Free</SelectLabel>
                      {model.subModel
                        .filter((sub) => !sub.premium)
                        .map((sub, idx) => (
                          <SelectItem key={idx} value={sub.id}>
                            {sub.name}
                          </SelectItem>
                        ))}
                    </SelectGroup>
                    <SelectGroup className="px-3">
                      <SelectLabel>Premium</SelectLabel>
                      {model.subModel
                        .filter((sub) => sub.premium)
                        .map((sub, idx) => (
                          <SelectItem
                            key={idx}
                            value={sub.id} // FIX: use id not name
                            disabled={!has1}
                          >
                            {sub.name} {<Lock className="h-4 w-4" />}
                          </SelectItem>
                        ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              )}
            </div>

            <div>
              {model.enable ? (
                <Switch
                  checked={model.enable}
                  disabled={model.premium && !has1}
                  onCheckedChange={(v) => onToggleChange(model.model, v)}
                />
              ) : (
                <MessageSquare
                  onClick={() => onToggleChange(model.model, true)}
                />
              )}
            </div>
          </div>

          {/* Upgrade notice */}
          {model.premium && !has1 && model.enable && (
            <div className="flex items-center justify-center h-full">
              <Button>
                <Lock />
                Upgrade to unlock
              </Button>
            </div>
          )}

          {/* Messages */}
          {model.enable && aiSelectedModels[model.model]?.enable && (
            <div className="flex-1 p-4">
              <div className="space-y-2">
                {messages[model.model]?.map((m, i) => (
                  <div
                    key={i}
                    className={`p-2 rounded-md ${
                      m.role === "user"
                        ? "bg-blue-100 text-blue-900"
                        : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    {m.role === "assistant" && (
                      <span className="text-sm text-gray-500">
                        {m.model || model.model}
                      </span>
                    )}

                    {m.content === "loading" ? (
                      <div className="flex gap-2 items-center">
                        <Loader2 size={14} className="animate-spin" />
                        <span>Thinking...</span>
                      </div>
                    ) : (
                      <SafeMarkdown content={m.content} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default AiMultiModels;
