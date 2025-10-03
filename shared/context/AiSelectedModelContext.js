// AiSelectedModelContext.js

import React, { createContext, useContext, useState } from 'react';

const AiSelectedModelContext = createContext();

export const AiSelectedModelProvider = ({ children }) => {
  const [aiSelectedModels, setAiSelectedModels] = useState({});
  const [messages, setMessages] = useState({});

  return (
    <AiSelectedModelContext.Provider value={{ aiSelectedModels, setAiSelectedModels, messages, setMessages }}>
      {children}
    </AiSelectedModelContext.Provider>
  );
};

export const useAiSelectedModelContext = () => useContext(AiSelectedModelContext);
