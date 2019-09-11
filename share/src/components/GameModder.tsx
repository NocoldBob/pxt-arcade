import React from 'react';
import TabBar from './TabBar'
import ColorPicker from './ColorPicker'

import '../css/GameModder.css';
import '../css/icons.css';
import '../css/SpriteEditor.css';
import { imageLiteralToBitmap, Bitmap } from '../sprite-editor/bitmap';
import { textToBitmap, createPngImg, updatePngImg, bitmapToBinHex, textToBinHex } from '../bitmap_helpers';
import { tickEvent } from '../telemetry/appinsights';
import { bunny_hop_bin_js } from '../games/bunny_hop/bin.js';
import { bunny_hop_main_ts } from '../games/bunny_hop/main.ts';
import { gameModderState } from '../App';
import { SpriteEditorComp } from './SpriteEditor';
import * as SE from '../sprite-editor/spriteEditor'
import SpriteGallery from './SpriteGallery';
// import { bunnyHopBinJs } from '../../public/games/bunny_hop/bunny_hop_min.js.js';

export interface GameModderProps {
    playHandler: (binJs: string) => void;
    changeMode: (mode: "play" | "share" | "mod") => void;
}

export interface UserImage {
    default: Bitmap,
    data: Bitmap,
    name: string,
    callToAction: string,
}
export interface GameModderState {
    userImages: UserImage[]
    currentImg: number,
    currentBackground: number,
}
function IsGameModderState(s: any): s is GameModderState {
    return !!(s as GameModderState).userImages
}

function CreateEmptyImageText(w: number, h: number) {
    let res = "\n"
    for (let i = 0; i < h; i++)
        res += ".".repeat(w) + "\n"
    return res
}
function GetImageTextDimensions(s: string): { w: number, h: number } {
    s = s.trim()
    let lns = s.split("\n")
    let ln1 = lns[0].replace(/\s/g, "")
    return {
        w: ln1.length,
        h: lns.length
    }
}

// TODO: either we need binHexToBitmap or we need the original source code

function mkPxtJson(): string {
    let json = {
        "name": "SampleIMages",
        "dependencies": {
            "device": "*"
        },
        "description": "",
        "files": [
            "main.blocks",
            "main.ts",
            "README.md"
        ],
        "preferredEditor": "blocksprj"
    }
    return JSON.stringify(json)
}

async function getTxtFile(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'text';
        xhr.onload = function () {
            var status = xhr.status;
            if (status === 200) {
                resolve(xhr.response);
            } else {
                const err = new Error(`Error response (${status}) from '${url}'; content: ${xhr.response}`);
                reject(err)
            }
        };
        xhr.send();
    });
};

const moddableImages: { [k: string]: string } = {
    "character": `
        . . . . . . . . . . . .
        . . . 1 1 . 1 1 . . . .
        . . . 1 3 . 1 3 . . . .
        . . . . 1 3 . 1 3 . . .
        . . . . 1 3 . 1 3 . . .
        . . . 1 1 1 1 1 1 . . .
        . . 1 1 1 1 1 1 1 1 . .
        . . 1 1 1 f 1 1 f 1 . .
        . . 1 1 1 1 1 1 1 1 . .
        . . 1 1 1 1 f f 1 1 . .
        . . . 1 1 1 1 1 1 . . .
        . 1 1 1 1 1 1 1 1 1 1 .
        . 1 1 1 1 1 1 1 1 1 1 .
        . . . . 1 1 1 1 . . . .
        . . . . 1 1 1 1 . . . .
        . . . . 1 1 1 1 . . . .
        . . . . 1 1 1 1 . . . .
        . . . . . 1 1 . . . . .
        . . . . . . 1 . . . . .
        . . . . . . . . . . . .
        . . . . . . . . . . . .
    `,
    "obstacle1": `
        . . . . . . . . . . . . . . . . . . . . . .
        . . . . . . . . . . 7 . . . . . . . . . . .
        . . . . . . . . . . 7 7 . . . . . . . . . .
        . . . . . . . . . 6 7 7 . . . . . . . . . .
        . . . . . . . . 6 6 7 7 7 . . . . . . . . .
        . . . . . . . . 6 6 7 7 7 . . . . . . . . .
        . . . . . . . . 6 6 7 7 7 7 . . . . . . . .
        . . . . . . . 6 6 7 7 7 7 7 . . . . . . . .
        . . . . . . 6 6 6 7 7 7 7 7 . . . . . . . .
        . . . . . . . . 6 6 6 6 6 . . . . . . . . .
        . . . . . . . . 6 6 6 6 . . . . . . . . . .
        . . . . . . . 6 6 6 6 6 7 7 . . . . . . . .
        . . . . . . 6 6 6 7 7 7 7 7 7 . . . . . . .
        . . . . . . 6 6 6 7 7 7 7 7 7 7 . . . . . .
        . . . . . . 6 6 7 7 7 7 7 7 7 7 7 . . . . .
        . . 6 6 6 6 6 7 7 7 7 7 7 7 7 7 7 7 7 . . .
        . . . 6 6 6 6 6 7 7 7 7 7 6 6 6 6 6 . . . .
        . . . . . . . . 6 6 6 6 7 7 . . . . . . . .
        . . . . . . . . 6 6 6 7 7 7 . . . . . . . .
        . . . . . . 6 6 7 7 7 7 7 7 7 . . . . . . .
        . . . 6 6 6 7 7 7 7 7 7 7 7 7 7 7 . . . . .
        6 6 6 6 7 7 7 7 7 7 7 7 7 7 7 7 7 7 . . . .
        6 6 6 7 7 7 7 7 7 7 7 7 7 7 7 7 7 7 7 7 7 6
        . . . 6 6 6 6 6 6 7 7 7 7 7 7 7 7 7 7 7 6 .
        . . . . . 6 6 6 6 e e e e 7 7 7 7 7 6 6 6 .
        . . . . . . . . . e e e e . . . . . . . . .
        . . . . . . . . . e e e e . . . . . . . . .
        . . . . . . . . . e e e e . . . . . . . . .
        . . . . . . . 6 . e e e e . . 6 . . . . . .
        . . . 6 6 6 . . . e e e e . 6 . . . . . . .
        . . . 6 . 6 . . . e e e e . . . . . . . . .
        . . . . . . . . . . . . . . . . . . . . . .
   `,
    "obstacle2": `
        . . . . . . . . . . . . . . .
        . . . . . . . . . . . . . . .
        . . . . . . . . . . . . . . .
        . . . . . . . . . . . . . . .
        . . . . . . . . . . . . . . .
        . . . . . . . . . . . . . . .
        . . . . . . . . . . . . . . .
        . . . . . . . . . . . . . . .
        . . . . . . . . . . . . . . .
        . . . . . . . . . . . . . . .
        . . . . . . . . . . . . . . .
        . . . . . . . . . . . . . . .
        . . . . . . . . . . . . . . .
        . . . . . . . . . . . . . . .
        . . . . . . . . . . . . . . .
        . . . . . . . . . . . . . . .
        . . . . . . . . . . . . . . .
        . . . . . . . . . . . . . . .
        . . . . . e e e e e . . . . .
        . . . . e e b b b e e . . . .
        . . . e e b e e e b e e . . .
        . . . e e b e e b b e e . . .
        . . . . e e b b e e e . . . .
        . . . e b e e e e b b e . . .
        . . . e e b b b b e e e . . e
        . . . e e e e e e e e . . e .
        . . . e b e e b e b e . e . e
        . . . e b e e e e b e e . . .
        . . . e e e b e e e e . . . .
        . . e e b e b e b e e e . . .
        . e e e e e e e e e e e e . .
        . . . . . . e e . . . . . . .
   `,
    "background": `
    . . . d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d . . .
    . . d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d . .
    . d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d .
    d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d
    d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d
    d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d
    d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d
    d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d
    d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d
    d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d
    d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d
    d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d
    d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d
    d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d
    d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d
    d d d d d d d d d d d d d d d d d d d b d d d d d d d d d d d d d d d d
    d d d d d d d d d d d d d d d d d d d b d d d d d d d d d d d d d d d d
    d d d d d d d d d d d d d d d d d d d b d d d d d d d d d d d d d d d d
    d d d d d d d d d d d d d d d d d d d b d d d d d d d d d d d d d d d d
    d d d d d d d d d d d d d d d d d d b b d d d d d d d d d d d d d d d d
    d d d d d d d d d d d d d d d d d d b b b d d d d d d d d d d d d d d d
    d d d d d d d d d d d d d d d d d b b b b d d d d d d d d d d d d d d d
    d d d d d d d d d d d d d d d b b b b b d d d d d d d d d d d d d d d d
    d d d d d d d d d d d d d d d d d d b b d d d d d d d d d d d d d d d d
    d d d d d d d d d d d d d d d d d b b b b d d d d d d d d d d d d d d d
    d d d d d d d d d d d d d d d d d b b b b d d d d d d d d d d d d d d d
    d d d d d d d d d d d d d d d d d b b b b b d d d d d d d d d d d d d d
    d d d d d d d d d d d d d d d d b b b b b b b d d d d d d d d d d d d d
    d d d d d d d d d d d d d d b b b b b b b b b b d d d d d d d d d d d d
    d d d d d d d d d d d d b b b b d d b b b b b b b d d d d d d d d d d d
    d d d d d d d d d d d d d d d d d b b b b d d d d d d d d d d d d d d d
    d d d d d d d d d d d d d d d d d b b b b d d d d d d d d d d d d d d d
    d d d d d d d d d d d d d d d d b b b b b b d d d d d d d d d d d d d d
    d d d d d d d d d d d d d d d d b b b b b b d d d d d d d d d d d d d d
    d d d d d d d d d d d d d d d b b b b b b b b d d d d d d d d d d d d d
    d d d d d d d d d d d d b b b b b b b b b b b b b d d d d d d d d d d d
    d d d d d d d d b b b b b b b b b b b b b b b b b b b b d d d d d d d d
    d d d d d d d d d d d b b b b b b b b b b b b b b b b d d d d d d d d d
    d d d d d d d d d d d d d d d d b b b b b b b d b d d d d d d d d d d d
    d d d d d d d d d d d d d d b b b b b b b b b b b b b b b b d d d d d d
    d d d d d d d d d d d b b b b b b b b b b b b b b b b b b d d d d d d d
    d d d d d d d d b b b b b b b b b b b b b b b b b b b d d d d d d d d d
    d d d d d d d d d d b b b b b d d d b b b b d d d d d d d d d d d d d d
    d d d d d d d d d d d d d d d d d d b b b d d d d d d d d d d d d d d d
    d d d d d d d d d d d d d d d d d d b d b d d d d d d d d d d d d d d d
    . d d d d d d d d d d d d d d d d d b d b d d d d d d d d d d d d d d .
    . . d d d d d d d d d d d d d d d d b b b d d d d d d d d d d d d d . .
    . . . d d d d d d d d d d d d d d d b b b d d d d d d d d d d d d . . .
`
}
const CALL_TO_ACTION: { [k: string]: string } = {
    "character": "Draw your character!",
    "obstacle1": "Draw an obstacle!",
    "obstacle2": "Draw another obstacle!",
    "background": "Choose your background!"
}
// TODO:
// 15x32 stump
// 22x32 tree



function range(len: number): number[] {
    return new Array(len)
        .fill(undefined)
        .map((_, i) => i)
}
function img2Rows(imgTxt: string) {
    let rows = imgTxt.split("\n")
        .map(r => r.replace(/\s/g, ""))
        .filter(r => !!r)
    return rows
}
function rows2img(rows: string[]): string {
    return rows.join('\n')
}
function resizeUp(imgTxt: string, targW: number, targH: number): string {
    let rows = img2Rows(imgTxt)
    let oldW = rows[0].length
    let oldH = rows.length

    if (oldW > targW || oldH > targH)
        return imgTxt;

    const left2add = Math.floor((targW - oldW) / 2)
    const right2add = targW - oldW - left2add
    const top2add = targH - oldH

    let addCols = (numL: number, numR: number) => {
        let l = '.'.repeat(numL)
        let r = '.'.repeat(numR)
        rows = rows.map(o => l + o + r)
    }
    let addRows = (numT: number) => {
        let newR = range(numT)
            .map(_ => '.'.repeat(targW))
        rows = [...newR, ...rows]
    }

    addCols(left2add, right2add)
    addRows(top2add)

    return rows2img(rows)
}
function resizeTo24x24(imgTxt: string) {
    return resizeUp(imgTxt, 24, 24)
}
function mirror(imgTxt: string): string {
    let rows = img2Rows(imgTxt)

    rows = rows.map(r =>
        r.split("").reverse().join(""))

    return rows2img(rows)
}

const SAMPLE_CHARACTERS = [`.`, `
    . . . . . . . . . . b 5 b . . .
    . . . . . . . . . b 5 b . . . .
    . . . . . . . . . b c . . . . .
    . . . . . . b b b b b b . . . .
    . . . . . b b 5 5 5 5 5 b . . .
    . . . . b b 5 d 1 f 5 5 d f . .
    . . . . b 5 5 1 f f 5 d 4 c . .
    . . . . b 5 5 d f b d d 4 4 . .
    b d d d b b d 5 5 5 4 4 4 4 4 b
    b b d 5 5 5 b 5 5 4 4 4 4 4 b .
    b d c 5 5 5 5 d 5 5 5 5 5 b . .
    c d d c d 5 5 b 5 5 5 5 5 5 b .
    c b d d c c b 5 5 5 5 5 5 5 b .
    . c d d d d d d 5 5 5 5 5 d b .
    . . c b d d d d d 5 5 5 b b . .
    . . . c c c c c c c c b b . . .
`, mirror(`
    e e e . . . . e e e . . . .
    c d d c . . c d d c . . . .
    c b d d f f d d b c . . . .
    c 3 b d d b d b 3 c . . . .
    f b 3 d d d d 3 b f . . . .
    e d d d d d d d d e . . . .
    e d f d d d d f d e . b f b
    f d d f d d f d d f . f d f
    f b d d b b d d 2 f . f d f
    . f 2 2 2 2 2 2 b b f f d f
    . f b d d d d d d b b d b f
    . f d d d d d b d d f f f .
    . f d f f f d f f d f . . .
    . f f . . f f . . f f . . .
`), mirror(`
    . . 4 4 4 . . . . 4 4 4 . . . .
    . 4 5 5 5 e . . e 5 5 5 4 . . .
    4 5 5 5 5 5 e e 5 5 5 5 5 4 . .
    4 5 5 4 4 5 5 5 5 4 4 5 5 4 . .
    e 5 4 4 5 5 5 5 5 5 4 4 5 e . .
    . e e 5 5 5 5 5 5 5 5 e e . . .
    . . e 5 f 5 5 5 5 f 5 e . . . .
    . . f 5 5 5 4 4 5 5 5 f . . f f
    . . f 4 5 5 f f 5 5 6 f . f 5 f
    . . . f 6 6 6 6 6 6 4 4 f 5 5 f
    . . . f 4 5 5 5 5 5 5 4 4 5 f .
    . . . f 5 5 5 5 5 4 5 5 f f . .
    . . . f 5 f f f 5 f f 5 f . . .
    . . . f f . . f f . . f f . . .
`)].map(resizeTo24x24)
const SAMPLE_OBSTACLES = [`.`, `
    . . . . . . . . . c c 8 . . . .
    . . . . . . 8 c c c f 8 c c . .
    . . . c c 8 8 f c a f f f c c .
    . . c c c f f f c a a f f c c c
    8 c c c f f f f c c a a c 8 c c
    c c c b f f f 8 a c c a a a c c
    c a a b b 8 a b c c c c c c c c
    a f c a a b b a c c c c c f f c
    a 8 f c a a c c a c a c f f f c
    c a 8 a a c c c c a a f f f 8 a
    . a c a a c f f a a b 8 f f c a
    . . c c b a f f f a b b c c 6 c
    . . . c b b a f f 6 6 a b 6 c .
    . . . c c b b b 6 6 a c c c c .
    . . . . c c a b b c c c . . . .
    . . . . . c c c c c c . . . . .
`, `
    . . . . . . b b b b . . . . . .
    . . . . . . b 4 4 4 b . . . . .
    . . . . . . b b 4 4 4 b . . . .
    . . . . . b 4 b b b 4 4 b . . .
    . . . . b d 5 5 5 4 b 4 4 b . .
    . . . . b 3 2 3 5 5 4 e 4 4 b .
    . . . b d 2 2 2 5 7 5 4 e 4 4 e
    . . . b 5 3 2 3 5 5 5 5 e e e e
    . . b d 7 5 5 5 3 2 3 5 5 e e e
    . . b 5 5 5 5 5 2 2 2 5 5 d e e
    . b 3 2 3 5 7 5 3 2 3 5 d d e 4
    . b 2 2 2 5 5 5 5 5 5 d d e 4 .
    b d 3 2 d 5 5 5 d d d 4 4 . . .
    b 5 5 5 5 d d 4 4 4 4 . . . . .
    4 d d d 4 4 4 . . . . . . . . .
    4 4 4 4 . . . . . . . . . . . .
`, `
    . . . b b b b b b b b b b . . .
    . . b 1 1 1 1 1 1 1 1 1 1 b . .
    . b 1 1 1 1 1 1 1 1 1 1 1 1 b .
    . b 1 1 1 1 1 1 1 1 1 1 1 1 b .
    . b d d c c c c c c c c d d b .
    . b d c 6 6 6 6 6 6 6 6 c d b .
    . b d c 6 1 d 6 6 6 6 6 c d b .
    . b d c 6 d 6 6 6 6 6 6 c d b .
    . b d c 6 6 6 6 6 6 6 6 c d b .
    . b d c 6 6 6 6 6 6 6 6 c d b .
    . b d c 6 6 6 6 6 6 6 6 c d b .
    . b d d c c c c c c c c d d b .
    . c b b b b b b b b b b b b c .
    f c c c c c c c c c c c c c c f
    f b b b b b b b b b b b b b b f
    f b c d d d d d d d d d d d b f
    f b c b b b b b b b b b b c b f
    f b c b b b b b b b b b b c b f
    f b c c c c c c c c c c c c b f
    f b b b b b b b b b b b b b b f
    f b f f f f f f f f f f f f b f
    f f f f f f f f f f f f f f f f
`].map(resizeTo24x24)

console.dir(SAMPLE_CHARACTERS)
console.dir(SAMPLE_OBSTACLES)

export class GameModder extends React.Component<GameModderProps, GameModderState> {
    protected playBtn: HTMLButtonElement | undefined;
    protected spriteEditor: SpriteEditorComp;
    protected header: HTMLHeadingElement | undefined;
    private tabImages: Bitmap[];
    private scale: number = 1.0;

    constructor(props: GameModderProps) {
        super(props);

        if (IsGameModderState(gameModderState)) {
            // Loading previous modder state
            this.state = gameModderState
        } else {
            // Creating new modder state
            let imgs = Object.keys(moddableImages)
                .map((name) => {
                    let def = moddableImages[name]
                    // TODO: match the original dimensions? One difficulty with this
                    // is the sprite editor canvas can't handle this
                    // let { w, h } = GetImageTextDimensions(moddableImages[name])
                    let [w, h] = [24, 24]
                    let blank = CreateEmptyImageText(w, h);
                    return {
                        data: imageLiteralToBitmap(blank),
                        name: name,
                        callToAction: CALL_TO_ACTION[name],
                        default: textToBitmap(def)
                    };
                })

            this.state = {
                userImages: imgs,
                currentImg: 0,
                currentBackground: 12
            }
            Object.assign(gameModderState, this.state)
        }

        this.tabImages = Object.keys(moddableImages)
            .map(k => moddableImages[k])
            .map(textToBitmap)
    }


    // async renderExperiments() {
    //     let tabBar = this.refs["tab-bar"] as TabBar
    //     let dummyImg = createPngImg(20, 20, 64, 64)
    //     tabBar.TabBarSvg.appendChild(dummyImg)
    //     setInterval(() => {
    //         updatePngImg(dummyImg, this.spriteEditor.bitmap().image)
    //     }, 500)

    //     function getImages(ts: string) {
    //         let imgRegex = /img`([\d\s\.a-f]*)`/gm
    //         let match = imgRegex.exec(ts);
    //         let res: string[] = []
    //         while (match != null) {
    //             res.push(match[1])
    //             match = imgRegex.exec(ts);
    //         }
    //         return res
    //     }

    //     // HACK:
    //     let mainTs = bunny_hop_main_ts;
    //     // let mainTs = await getTxtFile("games/bunny_hop/main.ts")

    //     // TODO: find images
    //     let imgs = getImages(mainTs)
    //     // console.dir(imgs)

    //     let imgsAsBmps = imgs.map(textToBitmap)
    //     // console.dir(imgsAsBmps)
    // }

    async renderGallery() {
        // TODO: move to seperate component
        const SVG_W = 541
        const OUT = 40
        const GAL_MARGIN_B = 50
        const GAL_SVG_H = 10 + GAL_MARGIN_B
        // const GAL_MARGIN_B = 20
        // const GAL_SVG_H = 40
        let galleryHolder = this.refs["sprite-gallery"] as HTMLDivElement
        let gallerySvg = document.createElementNS("http://www.w3.org/2000/svg", "svg")// as unknown as SVGSVGElement;
        let galleryEnd = document.createElementNS("http://www.w3.org/2000/svg", "path")
        let galleryEndPath = `M -${OUT},-${OUT} l 0,${OUT} l 0,${GAL_SVG_H - GAL_MARGIN_B} l ${OUT},0 h ${SVG_W} l ${OUT},0 l 0,-${GAL_SVG_H - GAL_MARGIN_B} l 0,-${OUT} z`
        galleryEnd.setAttribute("d", galleryEndPath)
        gallerySvg.setAttribute('viewBox', `0 0 ${SVG_W} ${GAL_SVG_H}`)
        gallerySvg.appendChild(galleryEnd)
        galleryHolder.appendChild(gallerySvg)
    }

    private saveCurrentUserImage(bmp: Bitmap) {
        // TODO: set image bug somehow?
        function updateUserImage(old: UserImage, nw: Bitmap): UserImage {
            return {
                data: nw,
                name: old.name,
                callToAction: old.callToAction,
                default: old.default
            }
        }
        let newState = {
            userImages: this.state.userImages.map((m, i) =>
                i === this.state.currentImg
                    ? updateUserImage(m, bmp)
                    : m)
        }
        this.setState(newState)
        Object.assign(gameModderState, newState)
    }

    private save() {
        if (this.spriteEditor) {
            tickEvent("shareExperiment.mod.image");
            this.spriteEditor.editor.commit()
            this.saveCurrentUserImage(this.spriteEditor.editor.bitmap().image)
        }
    }
    private applyImage(bmp: Bitmap) {
        if (this.spriteEditor) {
            this.spriteEditor.editor.bitmap().image = bmp
            this.spriteEditor.editor.rePaint()
        }
    }
    private load(idx: number) {
        let currImg = this.state.userImages[idx].data
        if (this.spriteEditor) {
            this.applyImage(currImg)
        }
    }

    onTabChange(idx: number) {
        this.save()
        this.setState({ currentImg: idx })
        if (IsGameModderState(gameModderState))
            gameModderState.currentImg = idx
        this.load(idx)
        tickEvent("shareExperiment.mod.tabChange");
    }

    onBackgroundColorChanged(idx: number) {
        this.setState({ currentBackground: idx })
        if (IsGameModderState(gameModderState))
            gameModderState.currentBackground = idx
    }

    onSpriteGalleryPick(bmp: Bitmap) {
        this.saveCurrentUserImage(bmp)
        this.applyImage(bmp)
    }

    render() {
        let currImg = this.state.userImages[this.state.currentImg]
        let isBackgroundTab = this.state.currentImg === 3

        let body = document.getElementsByTagName('body')[0]
        // const MARGIN = 20
        const HEADER_HEIGHT = 50
        let actualWidth = body.clientWidth
        let actualHeight = body.clientHeight - HEADER_HEIGHT
        let refWidth = 539.0
        let refHeight = SE.TOTAL_HEIGHT
        let wScale = actualWidth / refWidth
        let hScale = actualHeight / refHeight
        this.scale = Math.min(wScale, hScale)

        const SPRITE_GALLERY_HEIGHT = 100
        let spriteGalleryHeight = SPRITE_GALLERY_HEIGHT * this.scale
        let colorPickerHeight = (SE.TOTAL_HEIGHT + SPRITE_GALLERY_HEIGHT) * this.scale

        // TODO
        let isCharacter = this.state.currentImg == 0
        let spriteGalleryOptions =
            (isCharacter ? SAMPLE_CHARACTERS : SAMPLE_OBSTACLES)
                .map(i => imageLiteralToBitmap(i))

        let startImg = this.state.userImages[this.state.currentImg].data
        let galKey = `${isCharacter}__` + spriteGalleryOptions.map(b => b.buf.toString()).join("_")
        return (
            <div className="game-modder">
                <h1 ref="header">{currImg.callToAction}</h1>
                <TabBar ref="tab-bar" tabImages={this.tabImages}
                    tabChange={this.onTabChange.bind(this)} startTab={this.state.currentImg} />
                {isBackgroundTab
                    ?
                    <ColorPicker selectionChanged={this.onBackgroundColorChanged.bind(this)}
                        selected={this.state.currentBackground} colors={SE.COLORS}
                        height={colorPickerHeight}></ColorPicker>
                    :
                    [
                        <SpriteEditorComp ref="sprite-editor" key="image-editor" startImage={startImg}
                            onPlay={this.onPlay} scale={this.scale}></SpriteEditorComp>,
                        <SpriteGallery key={galKey} height={spriteGalleryHeight}
                            options={spriteGalleryOptions} onClick={this.onSpriteGalleryPick.bind(this)}
                        ></SpriteGallery>
                    ]}
                {/* <div ref="sprite-gallery" className="sprite-gallery">
                </div> */}
                <button ref="play-btn" className="play-btn">Play!</button>
            </div>
        )
    }

    async componentDidMount() {
        this.playBtn = this.refs["play-btn"] as HTMLButtonElement;
        this.spriteEditor = this.refs["sprite-editor"] as SpriteEditorComp;
        this.header = this.refs['header'] as HTMLHeadingElement

        // events
        this.playBtn.addEventListener('click', this.onPlay.bind(this))

        // TODO(dz):
        // await this.renderGallery();
        // await this.renderExperiments();

        // HACK: scaling
        this.header.setAttribute("style", `transform: scale(${this.scale})`);

        // HACK: Disable scrolling in iOS
        document.ontouchmove = function (e) {
            e.preventDefault();
        }
    }

    componentWillUnmount() {
        this.playBtn = undefined;
        this.spriteEditor = undefined;
        this.header = undefined;
    }

    async onPlay() {
        this.save()

        function modBackground(bin: string, newColor: number): string {
            const originalColor = 13
            const template = (color: number) => `scene_setBackgroundColor__P12360_mk(s);s.tmp_0.arg0=${color}`
            let old = template(originalColor)
            let newIdx = newColor + 1 // arcade function is 1-based b/c 0 is transparent
            let nw = template(newIdx)
            return bin.replace(old, nw)
        }

        function modImg(bin: string, img: UserImage): string {
            // HACK: for some reason the compiler emits image prefixes that look like:
            // 8704100010000000
            // whereas ours look like:
            // e4101000
            const MOD_PREFIX_LEN = "e4101000".length
            const BIN_PREFIX_LEN = "8704100010000000".length

            let newHex = bitmapToBinHex(img.data)
            let newIsBlank = newHex.slice(MOD_PREFIX_LEN).replace(/0/g, "").length == 0
            if (newIsBlank)
                newHex = bitmapToBinHex(img.default)

            const oldToFind = bitmapToBinHex(img.default)
                .slice(MOD_PREFIX_LEN)
            let oldStartIncl = bin.indexOf(oldToFind) - BIN_PREFIX_LEN
            if (oldStartIncl < 0)
                return bin;
            let oldEndExcl = bin.indexOf(`"`, oldStartIncl)
            let oldHex = bin.slice(oldStartIncl, oldEndExcl)

            return bin.replace(oldHex, newHex)
        }

        // HACK:
        let gameBinJs = bunny_hop_bin_js;
        for (let i of this.state.userImages) {
            gameBinJs = modImg(gameBinJs, i)
        }
        gameBinJs = modBackground(gameBinJs, this.state.currentBackground)

        this.props.playHandler(gameBinJs)
    }
}

export default GameModder;
