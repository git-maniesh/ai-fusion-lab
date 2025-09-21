import { Button } from '@/components/ui/button'
import { Mic, Paperclip, Send } from 'lucide-react'
import React from 'react'
import AiMultiModels from './AiMultiModels'

const ChatInputBox = () => {
  return (
    <div className='relative min-h-screen'>
        {/* page content */}
        <div>
            <AiMultiModels />

        </div>
        {/* fixed chat input */}
        <div className='fixed bottom-0  flex left-0 w-full justify-center px-4 pb-4'>
            <div className='w-full border rounded-xl shadow-md max-w-2xl p-4'>
                <input type="textarea" placeholder='Ask me anything' className='border-0 outline-none'/>
                <div className='mt-3 flex justify-between items-center'>
                    <Button variant={'ghost'} size={'icon'}>
                        <Paperclip className='h-5 w-5' />
                    </Button>
                    <div className='flex gap-5'>
                        <Button variant={'ghost'} size={'icon'}><Mic /> </Button>
                        <Button variant={''} size={'icon'} className={'bg-purple-600'}><Send /> </Button>

                    </div>
                </div>
            </div>
        </div>
    </div>
  )
}

export default ChatInputBox