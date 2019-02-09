import * as assert from 'assert'
import { isEnum } from '../src/model'
import * as E from './examples'

describe('model', () => {
  it('isEnum', () => {
    assert.strictEqual(isEnum(E.FooBarBaz), true)
    assert.strictEqual(isEnum(E.Option), false)
  })
})
