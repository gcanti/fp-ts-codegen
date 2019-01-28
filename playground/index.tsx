import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { run } from '../src'
import { Options, lenses, defaultOptions } from '../src/ast'
import Editor from 'react-simple-code-editor'
import { highlight, languages } from 'prismjs'
import 'prismjs/components/prism-typescript'
import * as pkg from '../package.json'

const defaultSource = 'data Option A = None | Some A'

interface Props {
  source: string
  encoding: Options['encoding']
}

interface State extends Props {
  code: string
}

const getState = (source: string, encoding: Options['encoding']): State => {
  return {
    source,
    encoding,
    code: run(source, lenses.encoding.set(encoding)(defaultOptions)).getOrElseL(e => `/** Error: ${e} */`)
  }
}

class App extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = getState(props.source, props.encoding)
  }

  render() {
    const onValueChange = (code: string) => {
      console.log(code)
    }
    const onCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      this.setState(getState(e.currentTarget.value, this.state.encoding))
    }
    const onEncodingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.currentTarget.checked) {
        this.setState(getState(this.state.source, 'fp-ts'))
      } else {
        this.setState(getState(this.state.source, 'literal'))
      }
    }
    const onExampleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      this.setState(getState(e.currentTarget.value, this.state.encoding))
    }
    return (
      <div>
        <h1>
          {pkg.name} playground (v{pkg.version})
        </h1>
        <table>
          <thead>
            <tr>
              <th>Source</th>
              <th>Output</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="source">
                <textarea rows={10} value={this.state.source} onChange={onCodeChange} />
                <input type="checkbox" onChange={onEncodingChange} /> fp-ts encoding
                <br />
                <br />
                Examples:
                <select onChange={onExampleChange}>
                  <option value="data Option A = None | Some A">Option</option>
                  <option value="data Either A B = Left A | Right B">Either</option>
                  <option value="data These A B = Left A | Right B | Both A B">These</option>
                  <option value="data Tree A = Leaf | Node (Tree A) A (Tree A)">Tree</option>
                  <option value="data These A B = Left { left :: A } | Right { right :: B } | Both { left :: A, right :: B }">
                    These (record syntax)
                  </option>
                </select>
              </td>
              <td className="code">
                <Editor
                  value={this.state.code}
                  onValueChange={code => onValueChange(code)}
                  highlight={code => {
                    return highlight(code, languages.js)
                  }}
                  padding={10}
                  style={{
                    fontFamily: '"Fira code", monospace',
                    fontSize: 12
                  }}
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    )
  }
}

ReactDOM.render(<App source={defaultSource} encoding="literal" />, document.getElementById('main'))
