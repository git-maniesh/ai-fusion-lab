"use client";

import { Button } from "@/components/ui/button";
import { Mic, Paperclip, Send } from "lucide-react";
import React, { useContext, useEffect, useState } from "react";
import AiMultiModels from "./AiMultiModels";
import { AiSelectedModelContext } from "@/shared/context/AiSelectedModelContext";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/config/FirebaseConfig";
import { useAuth, useUser } from "@clerk/nextjs";
import {useSearchParams} from "next/navigation"
import {toast} from 'sonner'


const ChatInputBox = () => {
  const [userInput, setUserInput] = useState("");
  const {has} = useAuth()
  // const paidUser = has({plan:'unlimited_plan'})
  const { messages, setMessages, aiSelectedModels, setAiSelectedModels } =
    useContext(AiSelectedModelContext);
  const {user} = useUser()
  


  const [chatId, setChatId] = useState(() => uuidv4());
    const params = useSearchParams()

  useEffect(() => {
    const chatId_ = params.get('chatId')
    if(chatId_){
      setChatId(chatId_)
      GetMessages(chatId_)
    }else{
      setMessages([])
      setChatId(uuidv4());
    }
    // setChatId(uuidv4());

  }, [params]);
  const GetMessages = async() =>{
    // setMessages([])
    const docRef = doc(db,"chatHistorY",chatId)
    const docSnap = await getDoc(docRef)
    const docData = docSnap.data()
    setMessages(docData.messages)
  }
  const handleSend = async () => {
    if (!userInput.trim()) return;
    // Deduct and Check Token Limit 


    if(!has({ plan: "unlimited_plan" })){
    // call only if only the userr is on free trail
    const result = await axios.post('/api/user-remaining-msg',{
      token:1
    })

    const remainingToken= result?.data?.reaminingToken
    if(remainingToken <= 0){
      console.log('Limit Exceeded')
      toast.error('Maximum Daily Limit Exceed')
      return;
    }}

    //add user message to all enabled models
    setMessages((prev) => {
      const updated = { ...prev };
      Object.keys(aiSelectedModels).forEach((modelKey) => {
        if (aiSelectedModels[modelKey].enable) {
          // if (modelInfo.enable) {
          updated[modelKey] = [
            ...(updated[modelKey] ?? []),
            { role: "user", content: userInput },
          ];
        }
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
          console.log(result);
          const { aiResponse, model } = result.data;
          setMessages((prev) => {
            const updated = [...(prev[parentModel] ?? [])];
            const loadingIndex = updated.findIndex((m) => m.loading);
            console.log("ai Response");

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
    if (chatId && messages) {
      SaveMessages();
    }
  }, [messages, chatId]);

  const SaveMessages = async () => {
    const docRef = doc(db, "chatHistorY", chatId);
    await setDoc(docRef, {
      chatId: chatId,
      userEmail:user?.primaryEmailAddress?.emailAddress ||
        user?.emailAddresses?.[0]?.emailAddress ||
        "",
      messages: messages,
      lastUpdated: Date.now()
    });
  };

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
            type="text"
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
                <Mic />
              </Button>
              <Button
                size={"icon"}
                className={"bg-purple-600"}
                onClick={handleSend}
              >
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
