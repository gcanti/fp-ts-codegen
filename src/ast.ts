import * as O from 'fp-ts/lib/Option'
import * as R from 'fp-ts/lib/Reader'
import * as ts from 'typescript'
import * as M from './model'
import { Lens } from 'monocle-ts'
import { tuple } from 'fp-ts/lib/function'
import * as S from 'fp-ts/lib/Semigroup'
import * as A from 'fp-ts/lib/Array'
import { head } from 'fp-ts/lib/NonEmptyArray'
import { pipe } from 'fp-ts/lib/pipeable'

/**
 * @since 0.4.0
 */
export interface Options {
  /** the name of the field used as tag */
  tagName: string
  /** the name prefix used for pattern matching functions */
  foldName: string
  /**
   * the pattern matching handlers can be expressed as positional arguments
   * or a single object literal `tag -> handler`
   */
  handlersStyle: { type: 'positional' } | { type: 'record'; handlersName: string }
}

/**
 * @since 0.4.0
 */
export const defaultOptions: Options = {
  tagName: 'type',
  foldName: 'fold',
  handlersStyle: { type: 'positional' }
}

const getLens = Lens.fromProp<Options>()

/**
 * @since 0.4.0
 */
export const lenses: { [K in keyof Options]: Lens<Options, Options[K]> } = {
  tagName: getLens('tagName'),
  foldName: getLens('foldName'),
  handlersStyle: getLens('handlersStyle')
}

/**
 * @since 0.4.0
 */
export interface AST<A> extends R.Reader<Options, A> {}

const getMemberName = (m: M.Member, position: number): string => {
  return pipe(
    m.name,
    O.getOrElse(() => `value${position}`)
  )
}

const getDomainParameterName = (type: M.Type): O.Option<string> => {
  switch (type.kind) {
    case 'Ref':
      return O.some(getFirstLetterLowerCase(type.name))
    case 'Tuple':
      return O.some('tuple')
    case 'Fun':
      return O.some('f')
    case 'Unit':
      return O.none
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
        pipe(
          getDomainParameterName(type.domain),
          O.map(domainName => [getParameterDeclaration(domainName, getTypeNode(type.domain))]),
          O.getOrElse<Array<ts.ParameterDeclaration>>(() => A.empty)
        ),
        getTypeNode(type.codomain)
      )
    case 'Unit':
      return ts.createTypeReferenceNode('undefined', A.empty)
  }
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

const getDataTypeParameterDeclarations = (d: M.Data): Array<ts.TypeParameterDeclaration> => {
  return d.parameterDeclarations.map(p =>
    ts.createTypeParameterDeclaration(
      p.name,
      pipe(
        p.constraint,
        O.map(getTypeNode),
        O.toUndefined
      )
    )
  )
}

const getDataTypeReferenceWithNever = (d: M.Data): ts.TypeReferenceNode => {
  return ts.createTypeReferenceNode(
    d.name,
    d.parameterDeclarations.map(p =>
      pipe(
        p.constraint,
        O.map(c => getTypeNode(c)),
        O.getOrElse<ts.TypeNode>(() => ts.createKeywordTypeNode(ts.SyntaxKind.NeverKeyword))
      )
    )
  )
}

const getDataTypeParameterReferences = (d: M.Data): Array<ts.TypeReferenceNode> => {
  return d.parameterDeclarations.map(p => ts.createTypeReferenceNode(p.name, A.empty))
}

const getDataType = (d: M.Data): ts.TypeReferenceNode => {
  return ts.createTypeReferenceNode(d.name, getDataTypeParameterReferences(d))
}

const getPropertySignature = (name: string, type: ts.TypeNode, isReadonly: boolean = true): ts.PropertySignature => {
  return ts.createPropertySignature(
    isReadonly ? [ts.createModifier(ts.SyntaxKind.ReadonlyKeyword)] : undefined,
    name,
    undefined,
    type,
    undefined
  )
}

/**
 * @since 0.4.0
 */
export function data(d: M.Data): AST<Array<ts.Node>> {
  return e => {
    const unionType = ts.createUnionTypeNode(
      d.constructors.map(c => {
        const members: Array<ts.TypeElement> = c.members.map((m, position) => {
          return getPropertySignature(getMemberName(m, position), getTypeNode(m.type))
        })
        const tag: ts.TypeElement = getPropertySignature(e.tagName, ts.createLiteralTypeNode(ts.createLiteral(c.name)))
        return ts.createTypeLiteralNode(M.isSum(d) ? [tag, ...members] : members)
      })
    )
    return [getTypeAliasDeclaration(d.name, unionType, getDataTypeParameterDeclarations(d))]
  }
}

const getFirstLetterLowerCase = (name: string): string => {
  return name.substring(0, 1).toLocaleLowerCase() + name.substring(1)
}

const getFirstLetterUpperCase = (name: string): string => {
  return name.substring(0, 1).toLocaleUpperCase() + name.substring(1)
}

const getConstantDeclaration = (
  name: string,
  initializer: ts.Expression,
  type?: ts.TypeReferenceNode,
  isExported: boolean = true
): ts.VariableStatement => {
  return ts.createVariableStatement(
    isExported ? [ts.createModifier(ts.SyntaxKind.ExportKeyword)] : A.empty,
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

const getParameterDeclaration = (name: string, type?: ts.TypeNode): ts.ParameterDeclaration => {
  return ts.createParameter(undefined, undefined, undefined, name, undefined, type, undefined)
}

const getLiteralNullaryConstructor = (c: M.Constructor, d: M.Data): AST<ts.Node> => {
  return e => {
    const name = getFirstLetterLowerCase(c.name)
    const initializer = ts.createObjectLiteral(
      M.isSum(d) ? [ts.createPropertyAssignment(e.tagName, ts.createStringLiteral(c.name))] : []
    )
    return getConstantDeclaration(name, initializer, getDataTypeReferenceWithNever(d))
  }
}

const getLiteralConstructor = (c: M.Constructor, d: M.Data): AST<ts.Node> => {
  return e => {
    const name = getFirstLetterLowerCase(c.name)
    const typeParameters = getDataTypeParameterDeclarations(d)
    const parameters = c.members.map((m, position) => {
      const name = getMemberName(m, position)
      const type = getTypeNode(m.type)
      return getParameterDeclaration(name, type)
    })
    const properties = c.members.map((m, position) => {
      const name = getMemberName(m, position)
      return ts.createShorthandPropertyAssignment(name)
    })
    const body = ts.createBlock([
      ts.createReturn(
        ts.createObjectLiteral(
          M.isSum(d)
            ? [ts.createPropertyAssignment(e.tagName, ts.createStringLiteral(c.name)), ...properties]
            : properties
        )
      )
    ])
    return getFunctionDeclaration(name, typeParameters, parameters, getDataType(d), body)
  }
}

/**
 * @since 0.4.0
 */
export function constructors(d: M.Data): AST<Array<ts.Node>> {
  const constructors = d.constructors.map(c =>
    A.foldLeft(() => getLiteralNullaryConstructor(c, d), () => getLiteralConstructor(c, d))(c.members)
  )
  return A.array.sequence(R.reader)(constructors)
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

const getFoldPositionalHandlers = (d: M.Data): Array<ts.ParameterDeclaration> => {
  const returnTypeParameterName = getFoldReturnTypeParameterName(d)
  return d.constructors.map(c => {
    const type = ts.createFunctionTypeNode(
      undefined,
      c.members.map((m, position) => getParameterDeclaration(getMemberName(m, position), getTypeNode(m.type))),
      ts.createTypeReferenceNode(returnTypeParameterName, A.empty)
    )
    return getParameterDeclaration(getFoldHandlerName(c), type)
  })
}

const getFoldRecordHandlers = (d: M.Data, handlersName: string): Array<ts.ParameterDeclaration> => {
  const returnTypeParameterName = getFoldReturnTypeParameterName(d)
  const type = ts.createTypeLiteralNode(
    d.constructors.map(c => {
      const type = ts.createFunctionTypeNode(
        undefined,
        c.members.map((m, position) => getParameterDeclaration(getMemberName(m, position), getTypeNode(m.type))),
        ts.createTypeReferenceNode(returnTypeParameterName, A.empty)
      )
      return getPropertySignature(getFoldHandlerName(c), type, false)
    })
  )
  return [getParameterDeclaration(handlersName, type)]
}

const getFoldPositionalBody = (d: M.Data, matcheeName: string, tagName: string) => {
  return ts.createBlock([
    ts.createSwitch(
      ts.createPropertyAccess(ts.createIdentifier(matcheeName), tagName),
      ts.createCaseBlock(
        d.constructors.map(c => {
          const access = ts.createIdentifier(getFoldHandlerName(c))
          return ts.createCaseClause(ts.createStringLiteral(c.name), [
            ts.createReturn(
              ts.createCall(
                access,
                A.empty,
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

const getFoldRecordBody = (d: M.Data, matcheeName: string, tagName: string, handlersName: string) => {
  return ts.createBlock([
    ts.createSwitch(
      ts.createPropertyAccess(ts.createIdentifier(matcheeName), tagName),
      ts.createCaseBlock(
        d.constructors.map(c => {
          const access = ts.createPropertyAccess(ts.createIdentifier(handlersName), getFoldHandlerName(c))
          return ts.createCaseClause(ts.createStringLiteral(c.name), [
            ts.createReturn(
              ts.createCall(
                access,
                A.empty,
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

const getFold = (d: M.Data, name: string): AST<ts.FunctionDeclaration> => {
  return e => {
    const matcheeName = 'fa'
    const tagName = e.tagName
    const handlersStyle = e.handlersStyle
    const returnTypeParameterName = getFoldReturnTypeParameterName(d)
    const typeParameterDeclarations = [
      ...getDataTypeParameterDeclarations(d),
      ts.createTypeParameterDeclaration(returnTypeParameterName)
    ]
    const handlers =
      handlersStyle.type === 'positional'
        ? getFoldPositionalHandlers(d)
        : getFoldRecordHandlers(d, handlersStyle.handlersName)
    const matchee = getParameterDeclaration(matcheeName, getDataType(d))
    const returnType = ts.createFunctionTypeNode(
      [],
      [matchee],
      ts.createTypeReferenceNode(returnTypeParameterName, A.empty)
    )
    const body = ts.createArrowFunction(
      [],
      [],
      [getParameterDeclaration(matcheeName)],
      undefined,
      undefined,
      handlersStyle.type === 'positional'
        ? getFoldPositionalBody(d, matcheeName, tagName)
        : getFoldRecordBody(d, matcheeName, tagName, handlersStyle.handlersName)
    )
    return getFunctionDeclaration(
      name,
      typeParameterDeclarations,
      handlers,
      returnType,
      ts.createBlock([ts.createReturn(body)])
    )
  }
}

/**
 * @since 0.4.0
 */
export function fold(d: M.Data): AST<O.Option<ts.FunctionDeclaration>> {
  if (!M.isSum(d)) {
    return R.of(O.none)
  } else {
    return pipe(
      R.ask<Options>(),
      R.chain(e => getFold(d, e.foldName)),
      R.map(O.some)
    )
  }
}

const getImportDeclaration = (namedImports: Array<string>, from: string): ts.ImportDeclaration => {
  return ts.createImportDeclaration(
    A.empty,
    A.empty,
    ts.createImportClause(
      undefined,
      ts.createNamedImports(namedImports.map(name => ts.createImportSpecifier(undefined, ts.createIdentifier(name))))
    ),
    ts.createStringLiteral(from)
  )
}

const getArrowFunction = (parameters: Array<string>, body: ts.ConciseBody) => {
  return ts.createArrowFunction(
    [],
    A.empty,
    parameters.map(p => getParameterDeclaration(p)),
    undefined,
    undefined,
    body
  )
}

/**
 * @since 0.4.0
 */
export function prisms(d: M.Data): AST<Array<ts.Node>> {
  return pipe(
    R.ask<Options>(),
    R.chain(e => {
      if (!M.isSum(d)) {
        return R.of(A.empty)
      }
      const dataType = getDataType(d)
      const type = ts.createTypeReferenceNode('Prism', [dataType, dataType])
      const getPrism = (name: string) => {
        return ts.createCall(ts.createPropertyAccess(ts.createIdentifier('Prism'), 'fromPredicate'), A.empty, [
          getArrowFunction(
            ['s'],
            getStrictEquals(ts.createPropertyAccess(ts.createIdentifier('s'), e.tagName), ts.createStringLiteral(name))
          )
        ])
      }
      const monocleImport = getImportDeclaration(['Prism'], 'monocle-ts')
      const typeParameters: Array<ts.TypeParameterDeclaration> = getDataTypeParameterDeclarations(d)
      const constructors = d.constructors
      if (M.isPolymorphic(d)) {
        return R.of([
          monocleImport,
          ...constructors.map<ts.Node>(c => {
            const body = ts.createBlock([ts.createReturn(getPrism(c.name))])
            return getFunctionDeclaration(`_${getFirstLetterLowerCase(c.name)}`, typeParameters, A.empty, type, body)
          })
        ])
      }
      return R.of([
        monocleImport,
        ...constructors.map(c => {
          return getConstantDeclaration(`_${c.name}`, getPrism(c.name), type)
        })
      ])
    })
  )
}

const semigroupBinaryExpression: S.Semigroup<ts.Expression> = {
  concat: (x, y) => ts.createBinary(x, ts.SyntaxKind.AmpersandAmpersandToken, y)
}

const getStrictEquals = (left: ts.Expression, right: ts.Expression): ts.BinaryExpression => {
  return ts.createBinary(left, ts.SyntaxKind.EqualsEqualsEqualsToken, right)
}

/**
 * @since 0.4.0
 */
export function eq(d: M.Data): AST<Array<ts.Node>> {
  const isSum = M.isSum(d)
  if (!isSum && M.isNullary(head(d.constructors))) {
    return R.of(A.empty)
  }
  const getMemberEqName = (c: M.Constructor, m: M.Member, position: number): string => {
    let s = 'eq'
    if (isSum) {
      s += c.name
    }
    return s + getFirstLetterUpperCase(getMemberName(m, position))
  }
  const constructors = d.constructors
  const eqsParameters = A.array.chain(constructors, c => {
    return c.members
      .map((m, position) => tuple(m, position))
      .filter(([m]) => !M.isRecursiveMember(m, d))
      .map(([m, position]) => {
        const type = ts.createTypeReferenceNode('Eq', [getTypeNode(m.type)])
        return getParameterDeclaration(getMemberEqName(c, m, position), type)
      })
  })
  const getReturnValue = (c: M.Constructor): ts.Expression => {
    return A.foldLeft(
      () => ts.createTrue(),
      () => {
        const callExpressions = c.members.map((m, position) => {
          const eqName = M.isRecursiveMember(m, d) ? 'S' : getMemberEqName(c, m, position)
          const memberName = getMemberName(m, position)
          return ts.createCall(ts.createPropertyAccess(ts.createIdentifier(eqName), 'equals'), A.empty, [
            ts.createPropertyAccess(ts.createIdentifier('x'), memberName),
            ts.createPropertyAccess(ts.createIdentifier('y'), memberName)
          ])
        })
        return S.fold(semigroupBinaryExpression)(callExpressions[0], callExpressions.slice(1))
      }
    )(c.members)
  }
  return pipe(
    R.ask<Options>(),
    R.chain(e => {
      const eqImport = getImportDeclaration(['Eq', 'fromEquals'], 'fp-ts/lib/Eq')
      const ifs = [
        ...constructors.map(c => {
          return ts.createIf(
            semigroupBinaryExpression.concat(
              getStrictEquals(ts.createPropertyAccess(ts.createIdentifier('x'), e.tagName), ts.createLiteral(c.name)),
              getStrictEquals(ts.createPropertyAccess(ts.createIdentifier('y'), e.tagName), ts.createLiteral(c.name))
            ),
            ts.createBlock([ts.createReturn(getReturnValue(c))])
          )
        }),
        ts.createReturn(ts.createFalse())
      ]
      const statements: Array<ts.Statement> = []
      if (isSum) {
        statements.push(...ifs)
      } else {
        statements.push(ts.createReturn(getReturnValue(head(d.constructors))))
      }
      const arrowFunction = getArrowFunction(['x', 'y'], ts.createBlock(statements))
      const eq = ts.createCall(ts.createIdentifier('fromEquals'), A.empty, [arrowFunction])
      const returnType = ts.createTypeReferenceNode('Eq', [getDataType(d)])
      const body = M.isRecursive(d)
        ? [getConstantDeclaration('S', eq, returnType, false), ts.createReturn(ts.createIdentifier('S'))]
        : [ts.createReturn(eq)]
      const typeParameters: Array<ts.TypeParameterDeclaration> = getDataTypeParameterDeclarations(d)
      return R.of([
        eqImport,
        getFunctionDeclaration('getEq', typeParameters, eqsParameters, returnType, ts.createBlock(body))
      ])
    })
  )
}
