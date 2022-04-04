const { resolve } = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './src/index.ts',
  output: {
    filename: 'built.js',
    path: resolve(__dirname, 'dist'),
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js']
  },
  module: {
    rules: [
      {
        test: /\.(png|jpe?g|gif|babylon|obj|glb)$/,
        type: 'asset',
        generator: {
          filename: 'img/[name].[hash:4][ext]'
        },
        parser: {
          dataUrlCondition: {
            maxSize: 30 * 1024
          }
        }
      },
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      // {
      //   test: /\.(babylon|obj|glb)$/,
      //   loader: 'url-loader',
      // }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      filename: "index.html",
      template: './src/index.html',
    }),
  ],
  mode: 'development',
  devtool: 'inline-source-map',
  devServer: {
    hot: true,
  },
  target: 'web',
}