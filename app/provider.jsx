import React from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'

function Provider({
    children, ...props
}) {
  return (
    <NextThemesProvider {...props}
    attribute={"class"}
    defaultTheme='system'
    enableSystem
    disableTransitionOnChange
    
    >
        <div>{children}</div>
    </NextThemesProvider>
  )
}

export default Provider