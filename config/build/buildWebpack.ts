import webpack from "webpack";
import HtmlWebpackPlugin from "html-webpack-plugin";
import {buildDevServer} from "./buildDevServer";
import {BuildOptions} from "./types/types";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
import {BundleAnalyzerPlugin} from "webpack-bundle-analyzer";
import {BuildResolve} from "./buildResolve";
import ReactRefreshPlugin from "@pmmmwh/react-refresh-webpack-plugin";
import ReactRefreshTypeScript from "react-refresh-typescript";
import path from "path";
import CopyPlugin from "copy-webpack-plugin";


export function buildWebpack(options: BuildOptions): webpack.Configuration {
    const {mode, paths, analyzer, platform} = options;
    const isDev = options.mode === 'development';
    const isProd = options.mode === 'production';
    const cssLoaderWithModuls = {
        loader: "css-loader",
        options: {
            modules: {
                localIdentName: isDev ? '[path][name]__[local]' : '[hash:base64:8]',
            },

        }
    }
    return {
        mode: mode ?? 'development',
        entry: paths.entry /* './src/index.tsx'*/, //entry точка входа в наше приложение
        output: {
            filename: '[name].[contenthash].js',
            path: paths.output,
            clean: true,
            publicPath: '/',  // ← добавь эту строку
        },
        plugins: [
            new HtmlWebpackPlugin({template: paths.html, favicon: path.resolve(paths.public, 'favicon.ico')}), //подставляет скрипты для нашей html
            isDev && new ReactRefreshPlugin(),
            isProd && new CopyPlugin({
                patterns: [
                    { from: path.resolve(paths.public, 'locales'), to: path.resolve(paths.output, 'locales') },//для перевода на языки другие
                ],
            }),
            new webpack.DefinePlugin({
                __PLATFORM__: JSON.stringify(platform),
                __ENV__: JSON.stringify(mode),
            }),
            analyzer && new BundleAnalyzerPlugin(),
            isDev && new webpack.ProgressPlugin(), //может замедлять сборку
         /*   isDev && new ForkTsCheckerWebpackPlugin(),*/
            isProd && new MiniCssExtractPlugin({
                filename: 'css/[name].[contenthash:8].css',
                chunkFilename: 'css/[name].[contenthash:8].css',
            }),

        ].filter(Boolean),

        module: {
            rules: [ //указываются лоудеры (css => js и тд ) порядок важен
                {
                    test: /\.s[ac]ss$/i,
                    use: [
                        // для отдельного файла css при сборке
                        isDev ? 'style-loader' : MiniCssExtractPlugin.loader,
                        // Translates CSS into CommonJS
                        cssLoaderWithModuls,
                        // Compiles Sass to CSS
                        "sass-loader",
                    ],
                },

                //добавить в вебпак надо
                {
                    test: /\.css$/i,
                    use: ["style-loader", "css-loader"],
                },
                {
                    test: /\.(png|jpg|jpeg|gif)$/i,
                    type: 'asset/resource'
                },
                {
                    test: /\.tsx?$/,
                    exclude: /node_modules/, //файлы которые не надо обрабатывать
                    use:[
                        {
                            loader: 'ts-loader',
                            options: {
                                transpileOnly: isDev, //isDev не показывает ошибки ts , isProd показывает
                                getCustomTransformers: () => ({
                                    before: [isDev && ReactRefreshTypeScript()].filter(Boolean),
                                }),
                            }
                        }
                    ],
                },
                {
                    test: /\.svg$/i,
                    use: [
                        {
                            loader: '@svgr/webpack',
                            options: {
                                icons: true,
                                svgoConfig: {
                                    plugins: [
                                        {
                                            name: 'convertColors',
                                            params: {
                                                currentColor: true,
                                            }
                                        }
                                    ]
                                }
                            }
                        }
                    ],
                },
            ],
        },
        resolve: BuildResolve(options),
        devtool: isDev ? 'inline-source-map' : 'source-map', //для возможности отслеживать ошибки в проекте
        devServer: isDev ? buildDevServer(options) : undefined
    }
}
