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
                useTypeImports: true,
                defaultScalarType: 'unknown',
                scalars: {
                    Upload: {
                        input: 'File',
                        output: 'unknown'
                    }
                }
            }
        }
    }
}

export default config
