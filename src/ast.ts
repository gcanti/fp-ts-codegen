import { none, Option, some } from 'fp-ts/lib/Option'
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
  encoding: 'literal' | 'fp-ts'
}

export const defaultOptions: Options = {
  tagName: 'type',
  foldName: 'fold',
  matcheeName: 'fa',
  handlersStyle: { type: 'positional' },
  encoding: 'literal'
}

const getLens = Lens.fromProp<Options>()

export const lenses: { [K in keyof Options]: Lens<Options, Options[K]> } = {
  tagName: getLens('tagName'),
  foldName: getLens('foldName'),
  matcheeName: getLens('matcheeName'),
  handlersStyle: getLens('handlersStyle'),
  encoding: getLens('encoding')
}

export interface AST<A> extends Reader<Options, A> {}

const getMemberName = (m: M.Member, position: number): string => {
  return m.name.getOrElseL(() => `value${position}`)
}

const getDomainParameterName = (type: M.Type): Option<string> => {
  switch (type.kind) {
    case 'Ref':
      return some(getFirstLetterLowerCase(type.name))
    case 'Tuple':
      return some('tuple')
    case 'Fun':
      return some('f')
    case 'Unit':
      return none
  }
}

const getTypeNode = (type: M.Type): ts.TypeNode => {
  switch (type.kind) {
    case 'Ref':
      return ts.createTypeReferenceNode(type.name, type.parameters.map(p => getTypeNode(p)))
    case 'Tuple':
      return ts.createTupleTypeNode(type.types.map(getTypeNode))
    case 'Fun':
      return ts.createFunctionTypeNode(
        undefined,
        getDomainParameterName(type.domain)
          .map(domainName => [getParameterDeclaration(domainName, getTypeNode(type.domain))])
          .getOrElse([]),
        getTypeNode(type.codomain)
      )
    case 'Unit':
      return ts.createTypeReferenceNode('undefined', [])
  }
}

const getDataLiteralEncoding = (d: M.Data): AST<Array<ts.Node>> => {
  return new Reader(e => {
    const unionType = ts.createUnionTypeNode(
      d.constructors.toArray().map(c => {
        const tag: ts.TypeElement = getPropertySignature(e.tagName, ts.createLiteralTypeNode(ts.createLiteral(c.name)))
        const members: Array<ts.TypeElement> = c.members.map((m, position) => {
          return getPropertySignature(getMemberName(m, position), getTypeNode(m.type))
        })
        return ts.createTypeLiteralNode([tag, ...members])
      })
    )
    return [
      getTypeAliasDeclaration(
        d.name,
        unionType,
        d.parameterDeclarations.map(p =>
          ts.createTypeParameterDeclaration(p.name, p.constraint.map(getTypeNode).toUndefined())
        )
      )
    ]
  })
}

const getTypeAliasDeclaration = (
  name: string,
  type: ts.TypeNode,
  typeParameters?: Array<ts.TypeParameterDeclaration>
) => {
  return ts.createTypeAliasDeclaration(
    undefined,
    [ts.createModifier(ts.SyntaxKind.ExportKeyword)],
    name,
    typeParameters,
    type
  )
}

const URI2HKTNames: Record<number, string> = {
  1: 'URI2HKT',
  2: 'URI2HKT2',
  3: 'URI2HKT3',
  4: 'URI2HKT4'
}
const URI2HKTParametersNames = ['A', 'L', 'U', 'X']

const getPropertySignature = (name: string, type: ts.TypeNode, isReadonly: boolean = true): ts.PropertySignature => {
  return ts.createPropertySignature(
    isReadonly ? [ts.createModifier(ts.SyntaxKind.ReadonlyKeyword)] : undefined,
    name,
    undefined,
    type,
    undefined
  )
}

const getInterfaceDeclaration = (
  name: string,
  typeParameters: Array<ts.TypeParameterDeclaration>,
  members: Array<ts.TypeElement>
): ts.InterfaceDeclaration => {
  return ts.createInterfaceDeclaration(undefined, undefined, name, typeParameters, undefined, members)
}

const getDataModuleDeclaration = (d: M.Data): ts.ModuleDeclaration => {
  const len = getDataParametersLength(d)
  const URI2HKT = URI2HKTNames[len]
  const parameters = URI2HKTParametersNames.slice(0, len).reverse()

  return ts.createModuleDeclaration(
    undefined,
    [ts.createModifier(ts.SyntaxKind.DeclareKeyword)],
    ts.createStringLiteral('fp-ts/lib/HKT'),
    ts.createModuleBlock([
      getInterfaceDeclaration(URI2HKT, parameters.map(p => ts.createTypeParameterDeclaration(p)), [
        getPropertySignature(
          d.name,
          ts.createTypeReferenceNode(d.name, parameters.map(p => ts.createTypeReferenceNode(p, []))),
          false
        )
      ])
    ]),
    undefined
  )
}

const getPropertyDeclaration = (
  name: string,
  type: ts.TypeNode,
  inizializer?: ts.Expression,
  isExclamation: boolean = false
): ts.PropertyDeclaration => {
  return ts.createProperty(
    undefined,
    [ts.createModifier(ts.SyntaxKind.ReadonlyKeyword)],
    name,
    isExclamation ? ts.createToken(ts.SyntaxKind.ExclamationToken) : undefined,
    type,
    inizializer
  )
}

const getMethod = (
  name: string,
  typeParameters: Array<ts.TypeParameterDeclaration>,
  parameters: Array<ts.ParameterDeclaration>,
  returnType: ts.TypeNode,
  body: ts.Block
) => {
  return ts.createMethod(undefined, undefined, undefined, name, undefined, typeParameters, parameters, returnType, body)
}

const getFoldMethod = (d: M.Data, c: M.Constructor, name: string, isEager: boolean) => {
  const returnTypeParameterName = getFoldReturnTypeParameterName(d)
  const handlerExpression = ts.createIdentifier(getFoldHandlerName(c))
  const returnExpression =
    isNullaryConstructor(c) && isEager
      ? handlerExpression
      : ts.createCall(
          handlerExpression,
          undefined,
          c.members.map((m, position) => {
            return ts.createPropertyAccess(ts.createThis(), getMemberName(m, position))
          })
        )
  const fold = getMethod(
    name,
    [ts.createTypeParameterDeclaration(returnTypeParameterName)],
    getFoldPositionalHandlers(d, isEager, c),
    ts.createTypeReferenceNode(returnTypeParameterName, []),
    ts.createBlock([ts.createReturn(returnExpression)])
  )
  return fold
}

const getDataFptsEncoding = (d: M.Data): AST<Array<ts.Node>> => {
  return new Reader(e => {
    const unionType = ts.createUnionTypeNode(
      d.constructors.toArray().map(c => {
        return ts.createTypeReferenceNode(
          c.name,
          d.parameterDeclarations.map(p => ts.createTypeReferenceNode(p.name, []))
        )
      })
    )

    const moduleDeclaration = getDataModuleDeclaration(d)

    const uriValue = getConstantDeclaration('URI', ts.createStringLiteral(d.name))

    const uriType = getTypeAliasDeclaration('URI', ts.createTypeQueryNode(ts.createIdentifier('URI')))

    const classes = d.constructors.toArray().map(c => {
      const typeParameters = d.parameterDeclarations.map(p => ts.createTypeParameterDeclaration(p.name))
      const parameters: Array<ts.ParameterDeclaration> = c.members.map((m, position) => {
        return getParameterDeclaration(getMemberName(m, position), getTypeNode(m.type), true)
      })
      const isNullary = isNullaryConstructor(c)
      const constructor = ts.createConstructor(
        undefined,
        isNullary ? [ts.createModifier(ts.SyntaxKind.PrivateKeyword)] : undefined,
        parameters,
        ts.createBlock([])
      )

      const tag = getPropertyDeclaration(
        '_tag',
        ts.createLiteralTypeNode(ts.createStringLiteral(c.name)),
        ts.createStringLiteral(c.name)
      )

      const len = getDataParametersLength(d)
      const fptsParameters = URI2HKTParametersNames.slice(0, len).map(name =>
        getPropertyDeclaration(`_${name}`, ts.createTypeReferenceNode(name, []), undefined, true)
      )

      const URI = getPropertyDeclaration('_URI', ts.createTypeReferenceNode('URI', []), undefined, true)

      let folds: Array<ts.ClassElement> = empty
      if (isSumType(d)) {
        if (isEagerFoldSupported(d)) {
          folds = [getFoldMethod(d, c, e.foldName, true), getFoldMethod(d, c, `${e.foldName}L`, false)]
        } else {
          folds = [getFoldMethod(d, c, e.foldName, false)]
        }
      }

      const members: Array<ts.ClassElement> = [tag, ...fptsParameters, URI, constructor, ...folds]
      if (isNullary) {
        members.unshift(
          ts.createProperty(
            undefined,
            [ts.createModifier(ts.SyntaxKind.StaticKeyword)],
            'value',
            undefined,
            ts.createTypeReferenceNode(
              d.name,
              d.parameterDeclarations.map(_ => ts.createTypeReferenceNode('never', []))
            ),
            ts.createNew(ts.createIdentifier(c.name), undefined, [])
          )
        )
      }
      return ts.createClassDeclaration(
        undefined,
        [ts.createModifier(ts.SyntaxKind.ExportKeyword)],
        c.name,
        typeParameters,
        undefined,
        members
      )
    })

    return [
      moduleDeclaration,
      uriValue,
      uriType,
      getTypeAliasDeclaration(
        d.name,
        unionType,
        d.parameterDeclarations.map(p =>
          ts.createTypeParameterDeclaration(p.name, p.constraint.map(getTypeNode).toUndefined())
        )
      ),
      ...classes
    ]
  })
}

const getDataParametersLength = (d: M.Data): number => {
  return d.parameterDeclarations.length
}

const shouldUseLiteralEncoding = (d: M.Data): AST<boolean> => {
  return new Reader(e => e.encoding === 'literal' || getDataParametersLength(d) > URI2HKTParametersNames.length)
}

export const data = (d: M.Data): AST<Array<ts.Node>> => {
  return shouldUseLiteralEncoding(d).chain(yes => (yes ? getDataLiteralEncoding(d) : getDataFptsEncoding(d)))
}

const getFirstLetterLowerCase = (name: string): string => {
  return name.substring(0, 1).toLocaleLowerCase() + name.substring(1)
}

const getConstantDeclaration = (
  name: string,
  initializer: ts.Expression,
  type?: ts.TypeReferenceNode
): ts.VariableStatement => {
  return ts.createVariableStatement(
    [ts.createModifier(ts.SyntaxKind.ExportKeyword)],
    ts.createVariableDeclarationList([ts.createVariableDeclaration(name, type, initializer)], ts.NodeFlags.Const)
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

const getParameterDeclaration = (
  name: string,
  type?: ts.TypeNode,
  isReadonly: boolean = false
): ts.ParameterDeclaration => {
  return ts.createParameter(
    undefined,
    isReadonly ? [ts.createModifier(ts.SyntaxKind.ReadonlyKeyword)] : undefined,
    undefined,
    name,
    undefined,
    type,
    undefined
  )
}

const getLiteralNullaryConstructor = (c: M.Constructor, d: M.Data): AST<ts.Node> => {
  return new Reader(e => {
    const name = getFirstLetterLowerCase(c.name)
    const type = ts.createTypeReferenceNode(
      d.name,
      d.parameterDeclarations.map(p =>
        p.constraint.map(c => getTypeNode(c)).getOrElse(ts.createKeywordTypeNode(ts.SyntaxKind.NeverKeyword))
      )
    )
    const initializer = ts.createObjectLiteral([ts.createPropertyAssignment(e.tagName, ts.createStringLiteral(c.name))])
    return getConstantDeclaration(name, initializer, type)
  })
}

const getLiteralConstructor = (c: M.Constructor, d: M.Data): AST<ts.Node> => {
  return new Reader(e => {
    const name = getFirstLetterLowerCase(c.name)
    const typeParameters = d.parameterDeclarations.map(p => {
      return ts.createTypeParameterDeclaration(p.name, p.constraint.map(getTypeNode).toUndefined())
    })
    const parameters = c.members.map((m, position) => {
      const name = getMemberName(m, position)
      const type = getTypeNode(m.type)
      return getParameterDeclaration(name, type)
    })
    const type = ts.createTypeReferenceNode(
      d.name,
      d.parameterDeclarations.map(p => ts.createTypeReferenceNode(p.name, []))
    )
    const body = ts.createBlock([
      ts.createReturn(
        ts.createObjectLiteral([
          ts.createPropertyAssignment(e.tagName, ts.createStringLiteral(c.name)),
          ...c.members.map((m, position) => {
            const name = getMemberName(m, position)
            return ts.createShorthandPropertyAssignment(name)
          })
        ])
      )
    ])
    return getFunctionDeclaration(name, typeParameters, parameters, type, body)
  })
}

const getConstructorsLiteralEncoding = (d: M.Data): AST<Array<ts.Node>> => {
  const constructors = d.constructors.toArray().map(c => {
    if (c.members.length === 0) {
      return getLiteralNullaryConstructor(c, d)
    } else {
      return getLiteralConstructor(c, d)
    }
  })
  return array.sequence(reader)(constructors)
}

const getFptsNullaryConstructor = (c: M.Constructor, d: M.Data): AST<ts.Node> => {
  return new Reader(_ => {
    const name = getFirstLetterLowerCase(c.name)
    const type = ts.createTypeReferenceNode(
      d.name,
      d.parameterDeclarations.map(p =>
        p.constraint.map(c => getTypeNode(c)).getOrElse(ts.createKeywordTypeNode(ts.SyntaxKind.NeverKeyword))
      )
    )
    const initializer = ts.createPropertyAccess(ts.createIdentifier(c.name), 'value')
    return getConstantDeclaration(name, initializer, type)
  })
}

const getFptsConstructor = (c: M.Constructor, d: M.Data): AST<ts.Node> => {
  return new Reader(_ => {
    const name = getFirstLetterLowerCase(c.name)
    const typeParameters = d.parameterDeclarations.map(p => {
      return ts.createTypeParameterDeclaration(p.name, p.constraint.map(getTypeNode).toUndefined())
    })
    const parameters = c.members.map((m, position) => {
      const name = getMemberName(m, position)
      const type = getTypeNode(m.type)
      return getParameterDeclaration(name, type)
    })
    const type = ts.createTypeReferenceNode(
      d.name,
      d.parameterDeclarations.map(p => ts.createTypeReferenceNode(p.name, []))
    )
    const body = ts.createBlock([
      ts.createReturn(
        ts.createNew(
          ts.createIdentifier(c.name),
          undefined,
          c.members.map((m, position) => {
            return ts.createIdentifier(getMemberName(m, position))
          })
        )
      )
    ])
    return getFunctionDeclaration(name, typeParameters, parameters, type, body)
  })
}

const getConstructorsFptsEncoding = (d: M.Data): AST<Array<ts.Node>> => {
  const constructors = d.constructors.toArray().map(c => {
    if (c.members.length === 0) {
      return getFptsNullaryConstructor(c, d)
    } else {
      return getFptsConstructor(c, d)
    }
  })
  return array.sequence(reader)(constructors)
}

export const constructors = (d: M.Data): AST<Array<ts.Node>> => {
  return shouldUseLiteralEncoding(d).chain(yes =>
    yes ? getConstructorsLiteralEncoding(d) : getConstructorsFptsEncoding(d)
  )
}

const isNullaryConstructor = (c: M.Constructor): boolean => {
  return c.members.length === 0
}

const isEagerFoldSupported = (d: M.Data): boolean => {
  return d.constructors.toArray().some(isNullaryConstructor)
}

const isSumType = (d: M.Data): boolean => {
  return d.constructors.length() > 1
}

const getFoldReturnTypeParameterName = (d: M.Data): string => {
  const base = 'R'
  let candidate = base
  let counter = 0
  while (d.parameterDeclarations.findIndex(({ name }) => candidate === name) !== -1) {
    candidate = base + ++counter
  }
  return candidate
}

const getFoldHandlerName = (c: M.Constructor): string => {
  return `on${c.name}`
}

const getFoldPositionalHandlers = (
  d: M.Data,
  isEager: boolean,
  usedConstructor?: M.Constructor
): Array<ts.ParameterDeclaration> => {
  const returnTypeParameterName = getFoldReturnTypeParameterName(d)
  return d.constructors.toArray().map(c => {
    const type =
      isEager && isNullaryConstructor(c)
        ? ts.createTypeReferenceNode(returnTypeParameterName, [])
        : ts.createFunctionTypeNode(
            undefined,
            c.members.map((m, position) => getParameterDeclaration(getMemberName(m, position), getTypeNode(m.type))),
            ts.createTypeReferenceNode(returnTypeParameterName, [])
          )
    const isParameterUnused = usedConstructor !== undefined && usedConstructor !== c
    const foldHandlerName = isParameterUnused ? `_${getFoldHandlerName(c)}` : getFoldHandlerName(c)
    return getParameterDeclaration(foldHandlerName, type)
  })
}

const getFoldRecordHandlers = (d: M.Data, handlersName: string, isEager: boolean): Array<ts.ParameterDeclaration> => {
  const returnTypeParameterName = getFoldReturnTypeParameterName(d)
  const type = ts.createTypeLiteralNode(
    d.constructors.toArray().map(c => {
      const type =
        isEager && isNullaryConstructor(c)
          ? ts.createTypeReferenceNode(returnTypeParameterName, [])
          : ts.createFunctionTypeNode(
              undefined,
              c.members.map((m, position) => getParameterDeclaration(getMemberName(m, position), getTypeNode(m.type))),
              ts.createTypeReferenceNode(returnTypeParameterName, [])
            )
      return getPropertySignature(getFoldHandlerName(c), type, false)
    })
  )
  return [getParameterDeclaration(handlersName, type)]
}

const getFoldPositionalBody = (d: M.Data, matcheeName: string, tagName: string, isEager: boolean) => {
  return ts.createBlock([
    ts.createSwitch(
      ts.createPropertyAccess(ts.createIdentifier(matcheeName), tagName),
      ts.createCaseBlock(
        d.constructors.toArray().map(c => {
          const access = ts.createIdentifier(getFoldHandlerName(c))
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

const getFoldRecordBody = (d: M.Data, matcheeName: string, tagName: string, handlersName: string, isEager: boolean) => {
  return ts.createBlock([
    ts.createSwitch(
      ts.createPropertyAccess(ts.createIdentifier(matcheeName), tagName),
      ts.createCaseBlock(
        d.constructors.toArray().map(c => {
          const access = ts.createPropertyAccess(ts.createIdentifier(handlersName), getFoldHandlerName(c))
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
    const returnTypeParameterName = getFoldReturnTypeParameterName(d)
    const typeParameters = d.parameterDeclarations
      .concat(M.parameterDeclaration(returnTypeParameterName, none))
      .map(p => ts.createTypeParameterDeclaration(p.name, p.constraint.map(getTypeNode).toUndefined()))
    const matchee = getParameterDeclaration(
      matcheeName,
      ts.createTypeReferenceNode(d.name, d.parameterDeclarations.map(p => ts.createTypeReferenceNode(p.name, [])))
    )
    const handlers =
      handlersStyle.type === 'positional'
        ? getFoldPositionalHandlers(d, isEager)
        : getFoldRecordHandlers(d, handlersStyle.handlersName, isEager)
    const parameters = [matchee, ...handlers]
    const type = ts.createTypeReferenceNode(returnTypeParameterName, [])
    const body =
      handlersStyle.type === 'positional'
        ? getFoldPositionalBody(d, matcheeName, tagName, isEager)
        : getFoldRecordBody(d, matcheeName, tagName, handlersStyle.handlersName, isEager)
    return getFunctionDeclaration(name, typeParameters, parameters, type, body)
  })
}

export const fold = (d: M.Data): AST<Array<ts.FunctionDeclaration>> => {
  return ask<Options>().chain(e => {
    let folds: Array<AST<ts.FunctionDeclaration>> = empty
    if (e.encoding === 'literal') {
      if (isSumType(d)) {
        if (isEagerFoldSupported(d)) {
          folds = [getFold(d, e.foldName, true), getFold(d, `${e.foldName}L`, false)]
        } else {
          folds = [getFold(d, e.foldName, false)]
        }
      }
    }
    return array.sequence(reader)(folds)
  })
}

const isPolymorphic = (d: M.Data): boolean => {
  return d.parameterDeclarations.length > 0
}

export const prisms = (d: M.Data): AST<Array<ts.Node>> => {
  return ask<Options>().chain(e => {
    if (!isSumType(d)) {
      return reader.of(empty)
    }
    const dataType = ts.createTypeReferenceNode(
      d.name,
      d.parameterDeclarations.map(p => ts.createTypeReferenceNode(p.name, []))
    )
    const type = ts.createTypeReferenceNode('Prism', [dataType, dataType])
    const getPrism = (name: string) => {
      return ts.createCall(
        ts.createPropertyAccess(ts.createIdentifier('Prism'), 'fromPredicate'),
        [],
        [
          ts.createArrowFunction(
            [],
            [],
            [getParameterDeclaration('s')],
            undefined,
            undefined,
            ts.createBinary(
              ts.createPropertyAccess(ts.createIdentifier('s'), e.tagName),
              ts.SyntaxKind.EqualsEqualsEqualsToken,
              ts.createStringLiteral(name)
            )
          )
        ]
      )
    }
    const monocleImport = ts.createImportDeclaration(
      [],
      [],
      ts.createImportClause(
        undefined,
        ts.createNamedImports([ts.createImportSpecifier(undefined, ts.createIdentifier('Prism'))])
      ),
      ts.createStringLiteral('monocle-ts')
    )
    const typeParameters: Array<ts.TypeParameterDeclaration> = d.parameterDeclarations.map(p =>
      ts.createTypeParameterDeclaration(p.name, p.constraint.map(getTypeNode).toUndefined())
    )
    if (isPolymorphic(d)) {
      return reader.of([
        monocleImport,
        ...d.constructors.toArray().map<ts.Node>(c => {
          const body = ts.createBlock([ts.createReturn(getPrism(c.name))])
          return getFunctionDeclaration(`_${getFirstLetterLowerCase(c.name)}`, typeParameters, [], type, body)
        })
      ])
    }
    return reader.of([
      monocleImport,
      ...d.constructors.toArray().map(c => {
        return getConstantDeclaration(`_${c.name}`, getPrism(c.name), type)
      })
    ])
  })
}
