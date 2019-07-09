import * as assert from 'assert'
import { run } from '../src'
import { defaultOptions } from '../src/ast'

describe('index', () => {
  it('run', () => {
    const s1 = run('data Option A = None | Some A', defaultOptions)
    const s2 = run('data Option A = None | Some A')
    assert.deepStrictEqual(s1, s2)
  })
})
