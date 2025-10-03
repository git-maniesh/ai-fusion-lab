

"use client";

import React, { createContext, useState } from "react";

export const AiSelectedModelContext = createContext();

export const AiSelectedModelProvider = ({ children }) => {
  const [aiSelectedModels, setAiSelectedModels] = useState({
    GPT: { modelId: "gpt-3.5", enable: true },
    Claude: { modelId: "claude-1", enable: false },
  });

  const [messages, setMessages] = useState({}); // { GPT: [...], Claude: [...] }

  return (
    <AiSelectedModelContext.Provider
      value={{ aiSelectedModels, setAiSelectedModels, messages, setMessages }}
    >
      {children}
    </AiSelectedModelContext.Provider>
  );
};
