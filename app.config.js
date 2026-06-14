const pkg = require('./package.json');

module.exports = ({ config }) => {
    return {
        ...config,
        version: pkg.version,
    };
};
