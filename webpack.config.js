var debug = process.env.NODE_ENV !== "production";
var webpack = require('webpack');
var globalLibraries = {
    $: "jquery"
};
module.exports = {
    context: __dirname + '/public',
    devtool: debug ? "inline-sourcemap" : null,
    entry: __dirname + "/public/script/app.js",
    output: {
        path: __dirname + "/public",
        filename: "app.min.js"
    },
    plugins: debug ? [
        new webpack.ProvidePlugin(globalLibraries)
    ] : [
        new webpack.ProvidePlugin(globalLibraries),
        new webpack.optimize.DedupePlugin(),
        new webpack.optimize.OccurenceOrderPlugin(),
        new webpack.optimize.UglifyJsPlugin({ mangle: false, sourcemap: false }),
    ],
};