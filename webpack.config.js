var debug = process.env.NODE_ENV !== "production";
var webpack = require('webpack');
var globalLibraries = {
    $: "jquery",
    d3: "d3",
    L: "leaflet"
};
module.exports = {
    context: __dirname + '/public',
    devtool: debug ? "inline-sourcemap" : null,
    entry: __dirname + "/public/script/app.js",
    output: {
        path: __dirname + "/public",
        filename: "dist/app.min.js"
    },
    resolve: {
        extensions: ['', '.html', '.js', '.json', '.scss', '.css'],
        alias: {
            leaflet_css: __dirname + "/node_modules/leaflet/dist/leaflet.css",
            leaflet_marker: __dirname + "/node_modules/leaflet/dist/images/marker-icon.png",
            leaflet_marker_2x: __dirname + "/node_modules/leaflet/dist/images/marker-icon-2x.png",
            leaflet_marker_shadow: __dirname + "/node_modules/leaflet/dist/images/marker-shadow.png"
        }
    },
    module: {
        loaders: [
            { test: /\.css$/, loader: "style-loader!css-loader" },
            {test: /\.(png|jpg)$/, loader: "file-loader?name=dist/images/[name].[ext]"}
        ]
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