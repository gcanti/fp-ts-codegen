import * as E from 'fp-ts/lib/Either'
import { pipe } from 'fp-ts/lib/pipeable'
import { highlight, languages } from 'prismjs'
import 'prismjs/components/prism-typescript'
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import Editor from 'react-simple-code-editor'
import * as pkg from '../package.json'
import { run } from '../src'
import { defaultOptions, lenses, Options } from '../src/ast'

const defaultSource = 'data Option A = None | Some A'

interface Props {
  source: string
  handlersStyle: Options['handlersStyle']
}

interface State extends Props {
  code: string
}

const getState = (source: string, handlersStyle: Options['handlersStyle']): State => {
  const options = lenses.handlersStyle.set(handlersStyle)(defaultOptions)
  return {
    source,
    handlersStyle,
    code: pipe(
      run(source, options),
      E.getOrElse(e => `/*\n${e}\n*/`)
    )
  }
}

class App extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = getState(props.source, props.handlersStyle)
  }

  render() {
    const onValueChange = (code: string) => {
      console.log(code)
    }
    const onCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      this.setState(getState(e.currentTarget.value, this.state.handlersStyle))
    }
    const onHandlersStyleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.currentTarget.checked) {
        this.setState(getState(this.state.source, { type: 'record', handlersName: 'handlers' }))
      } else {
        this.setState(getState(this.state.source, { type: 'positional' }))
      }
    }
    const onExampleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      this.setState(getState(e.currentTarget.value, this.state.handlersStyle))
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
              <th>Output (unformatted)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="source">
                <textarea rows={10} value={this.state.source} onChange={onCodeChange} />
                <input type="checkbox" onChange={onHandlersStyleChange} /> fold handlers style:{' '}
                {this.state.handlersStyle.type}
                <br />
                <br />
                Examples:
                <select onChange={onExampleChange}>
                  <option value="data Option A = None | Some A">Option</option>
                  <option value="data Either A B = Left A | Right B">Either</option>
                  <option value="data These A B = Left A | Right B | Both A B">These</option>
                  <option value="data List A = Nil | Cons A (List A)">List</option>
                  <option value="data Tree A = Leaf | Node (Tree A) A (Tree A)">Tree</option>
                  <option value="data These A B = Left { left :: A } | Right { right :: B } | Both { left :: A, right :: B }">
                    These (record syntax)
                  </option>
                  <option value="data User = User { name :: string, surname :: string, age :: number }">User</option>
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

ReactDOM.render(<App source={defaultSource} handlersStyle={{ type: 'positional' }} />, document.getElementById('main'))
