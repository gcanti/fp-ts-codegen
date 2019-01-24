import { none } from 'fp-ts/lib/Option'
import { Reader, reader, ask } from 'fp-ts/lib/Reader'
import { array, empty } from 'fp-ts/lib/Array'
import * as ts from 'typescript'
import * as M from './model'
import { Lens } from 'monocle-ts'

export interface Options {
  /** the name of the field used as tag */
  tagName: string
  /** the name prefix used for pattern matching functions */
  foldName: string
  /** the name used for the input of pattern matching functions */
  matcheeName: string
  /**
   * the pattern matching handlers can be expressed as positional arguments
   * or a single object literal `tag -> handler`
   */
  handlersStyle: { type: 'positional' } | { type: 'record'; handlersName: string }
}

export const defaultOptions: Options = {
  tagName: 'type',
  foldName: 'fold',
  matcheeName: 'fa',
  handlersStyle: { type: 'positional' }
}

const getLens = Lens.fromProp<Options>()

export const lenses: { [K in keyof Options]: Lens<Options, Options[K]> } = {
  tagName: getLens('tagName'),
  foldName: getLens('foldName'),
  matcheeName: getLens('matcheeName'),
  handlersStyle: getLens('handlersStyle')
}

export interface AST<A> extends Reader<Options, A> {}

const getMemberName = (m: M.Member, position: number): string => {
  return m.name.getOrElseL(() => `value${position}`)
}

const getDomainName = (type: M.Type): string => {
  switch (type.kind) {
    case 'TypeReference':
      return lowerCase(type.name)
    case 'TupleType':
      return 'tuple'
    case 'FunctionType':
      return 'f'
  }
}

const getType = (type: M.Type): ts.TypeNode => {
  switch (type.kind) {
    case 'TypeReference':
      return ts.createTypeReferenceNode(type.name, type.parameters.map(p => getType(p)))
    case 'TupleType':
      return ts.createTupleTypeNode([getType(type.fst), getType(type.snd), ...type.other.map(getType)])
    case 'FunctionType':
      return ts.createFunctionTypeNode(
        undefined,
        [getParameterDeclaration(getDomainName(type.domain), getType(type.domain))],
        getType(type.codomain)
      )
  }
}

export const data = (d: M.Data): AST<ts.TypeAliasDeclaration> => {
  return new Reader(e => {
    const unionType = ts.createUnionTypeNode(
      d.constructors.toArray().map(c => {
        const tag: ts.TypeElement = ts.createPropertySignature(
          [ts.createModifier(ts.SyntaxKind.ReadonlyKeyword)],
          e.tagName,
          undefined,
          ts.createLiteralTypeNode(ts.createLiteral(c.name)),
          undefined
        )
        const members: Array<ts.TypeElement> = c.members.map((m, position) => {
          return ts.createPropertySignature(
            [ts.createModifier(ts.SyntaxKind.ReadonlyKeyword)],
            getMemberName(m, position),
            undefined,
            getType(m.type),
            undefined
          )
        })
        return ts.createTypeLiteralNode([tag, ...members])
      })
    )
    return ts.createTypeAliasDeclaration(
      undefined,
      [ts.createModifier(ts.SyntaxKind.ExportKeyword)],
      d.introduction.name,
      d.introduction.parameters.map(p =>
        ts.createTypeParameterDeclaration(p.name, p.constraint.map(getType).toUndefined())
      ),
      unionType
    )
  })
}

const lowerCase = (name: string): string => {
  return name.substring(0, 1).toLocaleLowerCase() + name.substring(1)
}

const getNullaryConstructorVariableStatement = (
  tagName: string,
  c: M.Constructor,
  introduction: M.Introduction
): ts.VariableStatement => {
  const name = lowerCase(c.name)
  return ts.createVariableStatement(
    [ts.createModifier(ts.SyntaxKind.ExportKeyword)],
    ts.createVariableDeclarationList(
      [
        ts.createVariableDeclaration(
          name,
          ts.createTypeReferenceNode(
            introduction.name,
            introduction.parameters.map(p =>
              p.constraint
                .map<ts.TypeNode>(c => getType(c))
                .getOrElse(ts.createKeywordTypeNode(ts.SyntaxKind.NeverKeyword))
            )
          ),
          ts.createObjectLiteral([ts.createPropertyAssignment(tagName, ts.createStringLiteral(c.name))])
        )
      ],
      ts.NodeFlags.Const
    )
  )
}

const getFunctionDeclaration = (
  name: string,
  typeParameters: Array<ts.TypeParameterDeclaration>,
  parameters: Array<ts.ParameterDeclaration>,
  type: ts.TypeNode,
  body: ts.Block
) => {
  return ts.createFunctionDeclaration(
    undefined,
    [ts.createModifier(ts.SyntaxKind.ExportKeyword)],
    undefined,
    name,
    typeParameters,
    parameters,
    type,
    body
  )
}

const getParameterDeclaration = (name: string, type: ts.TypeNode): ts.ParameterDeclaration => {
  return ts.createParameter(undefined, undefined, undefined, name, undefined, type, undefined)
}

const getConstructorFunctionDeclaration = (
  tagName: string,
  c: M.Constructor,
  introduction: M.Introduction
): ts.FunctionDeclaration => {
  const name = lowerCase(c.name)
  const typeParameters = introduction.parameters.map(p => {
    return ts.createTypeParameterDeclaration(p.name, p.constraint.map(getType).toUndefined())
  })
  const parameters = c.members.map((m, position) => {
    const name = getMemberName(m, position)
    const type = getType(m.type)
    return getParameterDeclaration(name, type)
  })
  const type = ts.createTypeReferenceNode(
    introduction.name,
    introduction.parameters.map(p => ts.createTypeReferenceNode(p.name, []))
  )
  const body = ts.createBlock([
    ts.createReturn(
      ts.createObjectLiteral([
        ts.createPropertyAssignment(tagName, ts.createStringLiteral(c.name)),
        ...c.members.map((m, position) => {
          const name = getMemberName(m, position)
          return ts.createShorthandPropertyAssignment(name)
        })
      ])
    )
  ])
  return getFunctionDeclaration(name, typeParameters, parameters, type, body)
}

export const constructors = (d: M.Data): AST<Array<ts.Node>> => {
  return new Reader(e => {
    return d.constructors.toArray().map(c => {
      if (c.members.length === 0) {
        return getNullaryConstructorVariableStatement(e.tagName, c, d.introduction)
      } else {
        return getConstructorFunctionDeclaration(e.tagName, c, d.introduction)
      }
    })
  })
}

const isNullaryConstructor = (c: M.Constructor): boolean => {
  return c.members.length === 0
}

const admitsEagerFold = (d: M.Data): boolean => {
  return d.constructors.toArray().some(isNullaryConstructor)
}

const isSumType = (d: M.Data): boolean => {
  return d.constructors.length() > 1
}

const getFoldReturnTypeParameterName = (i: M.Introduction): string => {
  const base = 'R'
  let candidate = base
  let counter = 0
  while (i.parameters.findIndex(({ name }) => candidate === name) !== -1) {
    candidate = base + ++counter
  }
  return candidate
}

const getHandlerName = (c: M.Constructor): string => {
  return `on${c.name}`
}

const getPositionalFoldHandlers = (d: M.Data, isEager: boolean): Array<ts.ParameterDeclaration> => {
  const returnTypeParameterName = getFoldReturnTypeParameterName(d.introduction)
  return d.constructors.toArray().map(c => {
    const type =
      isEager && isNullaryConstructor(c)
        ? ts.createTypeReferenceNode(returnTypeParameterName, [])
        : ts.createFunctionTypeNode(
            undefined,
            c.members.map((m, position) => getParameterDeclaration(getMemberName(m, position), getType(m.type))),
            ts.createTypeReferenceNode(returnTypeParameterName, [])
          )
    return getParameterDeclaration(getHandlerName(c), type)
  })
}

const getRecordFoldHandlers = (d: M.Data, handlersName: string, isEager: boolean): Array<ts.ParameterDeclaration> => {
  const returnTypeParameterName = getFoldReturnTypeParameterName(d.introduction)
  const type = ts.createTypeLiteralNode(
    d.constructors.toArray().map(c => {
      const type =
        isEager && isNullaryConstructor(c)
          ? ts.createTypeReferenceNode(returnTypeParameterName, [])
          : ts.createFunctionTypeNode(
              undefined,
              c.members.map((m, position) => getParameterDeclaration(getMemberName(m, position), getType(m.type))),
              ts.createTypeReferenceNode(returnTypeParameterName, [])
            )
      return ts.createPropertySignature(undefined, getHandlerName(c), undefined, type, undefined)
    })
  )
  return [getParameterDeclaration(handlersName, type)]
}

const getPositionalFoldBody = (d: M.Data, matcheeName: string, tagName: string, isEager: boolean) => {
  return ts.createBlock([
    ts.createSwitch(
      ts.createPropertyAccess(ts.createIdentifier(matcheeName), tagName),
      ts.createCaseBlock(
        d.constructors.toArray().map(c => {
          const access = ts.createIdentifier(getHandlerName(c))
          return ts.createCaseClause(ts.createStringLiteral(c.name), [
            ts.createReturn(
              isEager && isNullaryConstructor(c)
                ? access
                : ts.createCall(
                    access,
                    [],
                    c.members.map((m, position) => {
                      return ts.createPropertyAccess(ts.createIdentifier(matcheeName), getMemberName(m, position))
                    })
                  )
            )
          ])
        })
      )
    )
  ])
}

const getRecordFoldBody = (d: M.Data, matcheeName: string, tagName: string, handlersName: string, isEager: boolean) => {
  return ts.createBlock([
    ts.createSwitch(
      ts.createPropertyAccess(ts.createIdentifier(matcheeName), tagName),
      ts.createCaseBlock(
        d.constructors.toArray().map(c => {
          const access = ts.createPropertyAccess(ts.createIdentifier(handlersName), getHandlerName(c))
          return ts.createCaseClause(ts.createStringLiteral(c.name), [
            ts.createReturn(
              isEager && isNullaryConstructor(c)
                ? access
                : ts.createCall(
                    access,
                    [],
                    c.members.map((m, position) => {
                      return ts.createPropertyAccess(ts.createIdentifier(matcheeName), getMemberName(m, position))
                    })
                  )
            )
          ])
        })
      )
    )
  ])
}

const getFold = (d: M.Data, name: string, isEager: boolean): AST<ts.FunctionDeclaration> => {
  return new Reader(e => {
    const matcheeName = e.matcheeName
    const tagName = e.tagName
    const handlersStyle = e.handlersStyle
    const returnTypeParameterName = getFoldReturnTypeParameterName(d.introduction)
    const typeParameters = d.introduction.parameters
      .concat(M.parameter(returnTypeParameterName, none))
      .map(p => ts.createTypeParameterDeclaration(p.name, p.constraint.map(getType).toUndefined()))
    const matchee = getParameterDeclaration(
      matcheeName,
      ts.createTypeReferenceNode(
        d.introduction.name,
        d.introduction.parameters.map(p => ts.createTypeReferenceNode(p.name, []))
      )
    )
    const handlers =
      handlersStyle.type === 'positional'
        ? getPositionalFoldHandlers(d, isEager)
        : getRecordFoldHandlers(d, handlersStyle.handlersName, isEager)
    const parameters = [matchee, ...handlers]
    const type = ts.createTypeReferenceNode(returnTypeParameterName, [])
    const body =
      handlersStyle.type === 'positional'
        ? getPositionalFoldBody(d, matcheeName, tagName, isEager)
        : getRecordFoldBody(d, matcheeName, tagName, handlersStyle.handlersName, isEager)
    return getFunctionDeclaration(name, typeParameters, parameters, type, body)
  })
}

export const fold = (d: M.Data): AST<Array<ts.FunctionDeclaration>> => {
  return ask<Options>().chain(e => {
    let folds: Array<AST<ts.FunctionDeclaration>> = empty
    if (isSumType(d)) {
      if (admitsEagerFold(d)) {
        folds = [getFold(d, e.foldName, true), getFold(d, `${e.foldName}L`, false)]
      } else {
        folds = [getFold(d, e.foldName, false)]
      }
    }
    return array.sequence(reader)(folds)
  })
}
