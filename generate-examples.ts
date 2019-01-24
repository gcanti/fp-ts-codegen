import * as fs from 'fs'
import * as path from 'path'
import * as M from './src/model'
import { print } from './src/printer'
import * as E from './test/examples'

const examples = Object.keys(E).map(k => (E as any)[k] as M.Data)

examples.forEach(example => {
  const code = print(example) + '\n\n'
  const filePath = path.join(__dirname, `./examples/${example.introduction.name}.ts`)
  fs.writeFileSync(filePath, code, { encoding: 'utf-8' })
})

const index = examples.map(example => `import './${example.introduction.name}'`).join('\n') + '\n\n'

fs.writeFileSync(path.join(__dirname, `./examples/index.ts`), index, { encoding: 'utf-8' })
