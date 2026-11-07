import type { CodegenConfig } from '@graphql-codegen/cli'

const config: CodegenConfig = {
    schema: './schema.graphql',
    documents: ['src/**/*.graphql'],
    generates: {
        './src/gql/': {
            preset: 'client',
            presetConfig: {
                fragmentMasking: false
            },
            config: {
                useTypeImports: true
            }
        }
    }
}

export default config
