import { useState } from 'react'

import { View } from './components/view/view'
import { Layout } from './layout'

function App() {
  const [fileName, setFileName] = useState<string>('')

  return (
    <Layout fileName={fileName}>
      <View setFileName={setFileName} />
    </Layout>
  )
}

export default App
