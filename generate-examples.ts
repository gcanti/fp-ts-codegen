import * as fs from 'fs'
import * as path from 'path'
import * as M from './src/model'
import * as P from './src/printer'
import * as E from './test/examples'
import { defaultOptions } from './src/ast'

const examples = Object.keys(E).map(k => (E as any)[k] as M.Data)

const print = P.print(defaultOptions)

examples.forEach(example => {
  const code = print(example) + '\n\n'
  const filePath = path.join(__dirname, `./examples/${example.name}.ts`)
  fs.writeFileSync(filePath, code, { encoding: 'utf-8' })
})

const index = examples.map(example => `import './${example.name}'`).join('\n') + '\n\n'

fs.writeFileSync(path.join(__dirname, `./examples/index.ts`), index, { encoding: 'utf-8' })
