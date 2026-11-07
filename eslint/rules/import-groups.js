const groupNames = ['libraries', 'components', 'composables', 'stores', 'modules', 'enums']

function getGroup(node, specifier, filename) {
    const source = node.source.value
    const name = specifier.imported?.name ?? specifier.imported?.value ?? specifier.local.name
    const isType = node.importKind === 'type' || specifier.importKind === 'type'
    const isLocal = /^(?:\.|@\/|@lib\/)/.test(source)
    const isComponentPath = /(?:^|\/)components(?:\/|$)/.test(source)
    || (source === '.' && /\/components\//.test(filename))
    let group

    if (/(?:^|\/)enums?(?:\/|\.|$)/.test(source) || /Enum$/.test(name)) {
        group = 'enums'
    } else if (/(?:^|\/)stores?(?:\/|$)/.test(source) || /^use[A-Z].*Store$/.test(name)) {
        group = 'stores'
    } else if (/(?:^|\/)composables(?:\/|$)/.test(source) || /^use[A-Z]/.test(name)) {
        group = 'composables'
    } else if (/\.vue$/.test(source)
    || source === '@lucide/vue'
    || (isComponentPath && (isType || /^[A-Z]/.test(name)))
    || (!isType && ['vue', 'vue-router', 'reka-ui'].includes(source) && /^[A-Z]/.test(name))) {
        group = 'components'
    } else {
        group = isLocal ? 'modules' : 'libraries'
    }

    return groupNames.indexOf(group) + (isType ? 0 : groupNames.length)
}

export default {
    meta: {
        type: 'suggestion',
        fixable: 'code',
        schema: [],
        messages: {
            mixed: 'Разделите этот импорт на отдельные строки по группам из AGENTS.md.',
            order: 'Расположите импорты по группам из AGENTS.md и разделите группы одной пустой строкой.',
        },
    },
    create(context) {
        const sourceCode = context.sourceCode
        const filename = context.filename.replaceAll('\\', '/')

        function checkRun(nodes) {
            const entries = nodes.map(node => {
                const groups = new Set(node.specifiers.map(specifier => getGroup(node, specifier, filename)))

                if (groups.size > 1) {
                    context.report({ node, messageId: 'mixed' })
                }

                return { node, group: [...groups][0], mixed: groups.size > 1 }
            })

            if (entries.length < 2 || entries.some(entry => entry.mixed)) return

            const sorted = [...entries].sort((left, right) => left.group - right.group)
            const first = entries[0].node
            const last = entries.at(-1).node
            const range = [first.range[0], last.range[1]]
            const hasComments = entries.some(({ node }) =>
                sourceCode.getCommentsBefore(node).length > 0
        || sourceCode.getCommentsInside(node).length > 0
        || sourceCode.getCommentsAfter(node).length > 0)
            const hasWrongOrder = entries.some((entry, index) => entry !== sorted[index])
            const hasWrongSpacing = entries.slice(1).some((entry, index) => {
                const previous = entries[index]
                const gap = sourceCode.text.slice(previous.node.range[1], entry.node.range[0])
                const expectedLines = previous.group === entry.group ? 1 : 2

                return /^\s*$/.test(gap) && (gap.match(/\n/g) ?? []).length !== expectedLines
            })

            if (!hasWrongOrder && !hasWrongSpacing) return

            context.report({
                node: first,
                messageId: 'order',
                fix: hasComments ? undefined : fixer => {
                    const newline = sourceCode.text.includes('\r\n') ? '\r\n' : '\n'
                    const replacement = sorted.map((entry, index) => {
                        const separator = index === 0 ? '' : newline.repeat(sorted[index - 1].group === entry.group ? 1 : 2)

                        return separator + sourceCode.getText(entry.node)
                    }).join('')

                    return fixer.replaceTextRange(range, replacement)
                },
            })
        }

        return {
            Program(node) {
                let run = []

                for (const statement of node.body) {
                    if (statement.type === 'ImportDeclaration' && statement.specifiers.length > 0) {
                        run.push(statement)
                    } else {
                        checkRun(run)
                        run = []
                    }
                }

                checkRun(run)
            },
        }
    },
}
