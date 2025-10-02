

import { Progress } from '@/components/ui/progress'
import React from 'react'

const UsageCreditProgress = ({remainingToken}) => {
  return (
    <div className='p-3 border rounded-2xl flex flex-col gap-2 mb-5'>
        <h2 className='font-bold text-xl '>Free Plan</h2>
        <p className='text-gray-400'>{5-remainingToken}/5 message used</p>
        <Progress value={100-((5-remainingToken)/5 )* 100} />

    </div>
  )
}

export default UsageCreditProgress