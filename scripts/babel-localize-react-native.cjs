module.exports = function localizeReactNativeImports({ types: t }) {
  return {
    name: 'twinxcare-localize-react-native',
    visitor: {
      ImportDeclaration(path, state) {
        if ((state.filename || '').includes('node_modules')) return;
        if (path.node.source.value !== 'react-native') return;
        if ((state.filename || '').endsWith('LocalizedReactNative.tsx')) return;

        const localized = [];
        const untouched = [];

        for (const specifier of path.node.specifiers) {
          if (
            t.isImportSpecifier(specifier) &&
            t.isIdentifier(specifier.imported) &&
            ['Text', 'TextInput', 'Alert'].includes(specifier.imported.name)
          ) {
            localized.push(specifier);
          } else {
            untouched.push(specifier);
          }
        }

        if (!localized.length) return;

        const nodes = [];
        if (untouched.length) {
          nodes.push(t.importDeclaration(untouched, t.stringLiteral('react-native')));
        }
        nodes.push(
          t.importDeclaration(
            localized,
            t.stringLiteral('@/components/LocalizedReactNative'),
          ),
        );
        path.replaceWithMultiple(nodes);
      },
    },
  };
};
