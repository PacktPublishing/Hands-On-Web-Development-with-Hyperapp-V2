module.exports = {
  env: {
    test: {
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }],
      ],
    },
    build: {
      plugins: [
        [
          "@babel/plugin-transform-react-jsx",
          {
            pragma: "h"
          },
        ],
      ],
    },
  },
};
