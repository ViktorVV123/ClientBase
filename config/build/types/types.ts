export interface BuildPath {
    entry: string;
    html: string;
    output: string;
    src: string; //для абсолютных путей
    public:string
}
export type Mode = 'development' | 'production';
export type ModePlatform = 'desktop' | 'mobile';

export interface BuildOptions {
    port: number;
    paths: BuildPath;
    mode: Mode;
    platform: ModePlatform;
    analyzer?: boolean;
}