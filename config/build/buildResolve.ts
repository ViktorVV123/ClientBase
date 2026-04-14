import {BuildOptions} from "./types/types";
import {Configuration} from "mini-css-extract-plugin";

export function BuildResolve(options:BuildOptions):Configuration['resolve'] {
    return  {
        extensions: ['.tsx', '.ts', '.js'],
        alias:{
            '@': options.paths.src, //для абсолютных путей
        }
    }
}