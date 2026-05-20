const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = (env, argv) => {
  const isProd = argv.mode === 'production';

  return {
    devtool: isProd ? false : 'inline-source-map',
    entry: {
      background: path.resolve(__dirname, 'src/background/index.ts'),
      contentscript: path.resolve(__dirname, 'src/content-script/index.ts'),
      inpage: path.resolve(__dirname, 'src/inpage/index.ts'),
      popup: path.resolve(__dirname, 'src/ui/popup/index.tsx'),
      notification: path.resolve(__dirname, 'src/ui/approval/index.tsx'),
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].js',
      clean: true,
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js'],
      alias: {
        '@bg': path.resolve(__dirname, 'src/background'),
        '@ui': path.resolve(__dirname, 'src/ui'),
        '@shared': path.resolve(__dirname, 'src/ui/shared'),
      },
      fallback: {
        crypto: false,
        stream: require.resolve('stream-browserify'),
        buffer: require.resolve('buffer/'),
        process: require.resolve('process/browser.js'),
      },
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
        {
          test: /\.less$/,
          use: [
            MiniCssExtractPlugin.loader,
            'css-loader',
            {
              loader: 'less-loader',
              options: { lessOptions: { javascriptEnabled: true } },
            },
          ],
        },
        {
          test: /\.css$/,
          use: [MiniCssExtractPlugin.loader, 'css-loader'],
        },
        {
          test: /\.(png|svg|jpg|jpeg|gif)$/i,
          type: 'asset/resource',
        },
      ],
    },
    plugins: [
      new webpack.ProvidePlugin({
        Buffer: ['buffer', 'Buffer'],
        process: 'process/browser.js',
      }),
      new MiniCssExtractPlugin({ filename: '[name].css' }),
      new HtmlWebpackPlugin({
        template: path.resolve(__dirname, 'src/ui/popup/index.html'),
        filename: 'popup.html',
        chunks: ['popup'],
      }),
      new HtmlWebpackPlugin({
        template: path.resolve(__dirname, 'src/ui/approval/index.html'),
        filename: 'notification.html',
        chunks: ['notification'],
      }),
      new CopyPlugin({
        patterns: [
          { from: 'src/manifest.json', to: 'manifest.json' },
          { from: 'src/assets', to: 'assets', noErrorOnMissing: true },
        ],
      }),
    ],
    optimization: {
      minimize: isProd,
    },
    performance: { hints: false },
  };
};
