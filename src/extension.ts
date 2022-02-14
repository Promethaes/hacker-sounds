// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
'use strict';
import * as vscode from 'vscode';
import * as path from 'path';
import player, { PlayerConfig } from './player';
import debounce = require('lodash.debounce');
import { Socket } from 'dgram';
import { cpuUsage } from 'process';


let listener: EditorListener;
let isActive: boolean;
let isNotArrowKey: boolean;
let config: PlayerConfig = {
    macVol: 1,
    winVol: 100,
    linuxVol: 100
};

const net = require('net');
let socket = new net.Socket();
const cp = require('child_process');
const _playerWindowsPath = path.join(__dirname, '..', 'audio', 'VSCodeSoundHelper.exe');

export function activate(context: vscode.ExtensionContext) {
    console.log('Initializing "UNDERTALE Mode" extension');
    // is the extension activated? yes by default.
    isActive = context.globalState.get('UNDERTALE_Mode', true);
    config.macVol = context.globalState.get('mac_volume', 1);
    config.winVol = context.globalState.get('win_volume', 100);
    config.linuxVol = context.globalState.get('linux_volume', 1);
    cp.execFile(_playerWindowsPath);
    setTimeout(() => {
        socket.connect(6969, '127.0.0.1', () => {
        })
    }, 500);

    socket.on('data', (data: any) => {
        console.log(`${data}`);
    });

    socket.on('close', () => {
        socket.destroy();
    });

    // to avoid multiple different instances
    listener = listener || new EditorListener(player);

    vscode.commands.registerCommand('UNDERTALE_Mode.enable', () => {
        if (!isActive) {
            context.globalState.update('UNDERTALE_Mode', true);
            isActive = true;
            vscode.window.showInformationMessage('UNDERTALE Mode extension enabled');
        } else {
            vscode.window.showWarningMessage('UNDERTALE Mode extension is already enabled');
        }
    });
    vscode.commands.registerCommand('UNDERTALE_Mode.disable', () => {
        if (isActive) {
            context.globalState.update('UNDERTALE_Mode', false);
            isActive = false;
            vscode.window.showInformationMessage('UNDERTALE Mode extension disabled');
        } else {
            vscode.window.showWarningMessage('UNDERTALE Mode extension is already disabled');
        }
    });
    vscode.commands.registerCommand('UNDERTALE_Mode.volumeUp', () => {
        let newVol = null;

        switch (process.platform) {
            case 'darwin':
                config.macVol += 1;

                if (config.macVol > 10) {
                    vscode.window.showWarningMessage('UNDERTALE Mode already at maximum volume');
                    config.macVol = 10;
                }

                newVol = config.macVol;
                context.globalState.update('mac_volume', newVol);
                break;

            case 'win32':
                config.winVol += 10;

                if (config.winVol > 100) {
                    vscode.window.showWarningMessage('UNDERTALE Mode already at maximum volume');
                    config.winVol = 100;
                }

                newVol = config.winVol;
                context.globalState.update('win_volume', newVol);
                break;

            case 'linux':
                config.linuxVol += 1;

                if (config.linuxVol > 10) {
                    vscode.window.showWarningMessage('UNDERTALE Mode already at maximum volume');
                    config.linuxVol = 10;
                }

                newVol = config.linuxVol;
                context.globalState.update('linux_volume', newVol);
                break;

            default:
                newVol = 0;
                break;
        }

        vscode.window.showInformationMessage('UNDERTALE Mode volume raised: ' + newVol);
    });
    vscode.commands.registerCommand('UNDERTALE_Mode.volumeDown', () => {
        let newVol = null;

        switch (process.platform) {
            case 'darwin':
                config.macVol -= 1;

                if (config.macVol < 1) {
                    vscode.window.showWarningMessage('UNDERTALE Mode already at minimum volume');
                    config.macVol = 1;
                }

                newVol = config.macVol;
                context.globalState.update('mac_volume', newVol);
                break;

            case 'win32':
                config.winVol -= 10;

                if (config.winVol < 10) {
                    vscode.window.showWarningMessage('UNDERTALE Mode already at minimum volume');
                    config.winVol = 10;
                }

                newVol = config.winVol;
                context.globalState.update('win_volume', newVol);
                break;

            case 'linux':
                config.linuxVol -= 1;

                if (config.linuxVol < 1) {
                    vscode.window.showWarningMessage('UNDERTALE Mode already at minimum volume');
                    config.linuxVol = 1;
                }

                newVol = config.linuxVol;
                context.globalState.update('linux_volume', newVol);
                break;

            default:
                newVol = 0;
                break;
        }

        vscode.window.showInformationMessage('UNDERTALE Mode volume lowered: ' + newVol);
    });

    // Add to a list of disposables which are disposed when this extension is deactivated.
    context.subscriptions.push(listener);
}

// this method is called when your extension is deactivated
export function deactivate() { }

/**
 * Listen to editor changes and play a sound when a key is pressed.
 */
export class EditorListener {
    private _disposable: vscode.Disposable;
    private _subscriptions: vscode.Disposable[] = [];
    private _basePath: string = path.join(__dirname, '..');

    // Audio files
    private _spaceAudio: string = path.join(this._basePath, 'audio', 'spacebar.wav');
    private _deleteAudio: string = path.join(this._basePath, 'audio', 'delete.wav');
    private _otherKeysAudio: string = path.join(this._basePath, 'audio', 'key.wav');
    private _cutAudio: string = path.join(this._basePath, 'audio', 'cut.wav');
    private _pasteAudio: string = path.join(this._basePath, 'audio', 'paste.wav');
    private _enterAudio: string = path.join(this._basePath, 'audio', 'enter.wav');
    private _tabAudio: string = path.join(this._basePath, 'audio', 'tab.wav');
    private _arrowsAudio: string = path.join(this._basePath, 'audio', 'arrow.wav');

    constructor(private player: any) {
        isNotArrowKey = false;

        vscode.workspace.onDidChangeTextDocument(this._keystrokeCallback, this, this._subscriptions);
        vscode.window.onDidChangeTextEditorSelection(this._arrowKeysCallback, this, this._subscriptions);
        this._disposable = vscode.Disposable.from(...this._subscriptions);
        this.player = {
            play: (filePath: string) => player.play(filePath, config)
        };
    }

    _keystrokeCallback = debounce((event: vscode.TextDocumentChangeEvent) => {
        if (!isActive) { return; }

        let activeDocument = vscode.window.activeTextEditor && vscode.window.activeTextEditor.document;
        if (event.document !== activeDocument || event.contentChanges.length === 0) { return; }

        isNotArrowKey = true;
        let pressedKey = event.contentChanges[0].text;

        switch (pressedKey) {
            case '':
                if (event.contentChanges[0].rangeLength === 1) {
                    // backspace or delete pressed
                    //this.player.play(this._deleteAudio);
                    socket.write('2');
                } else {
                    // text cut
                    //this.player.play(this._cutAudio);
                    socket.write('1');
                }
                break;

            case ' ':
                // space bar pressed
                // this.player.play(this._spaceAudio);
                socket.write('6');
                break;

            case '\n':
                // enter pressed
                // this.player.play(this._enterAudio);
                socket.write('3');
                break;

            case '\t':
            case '  ':
            case '    ':
                // tab pressed
                // this.player.play(this._tabAudio);
                socket.write('7');
                break;

            default:
                let textLength = pressedKey.trim().length;

                switch (textLength) {
                    case 0:
                        // user hit Enter while indented
                        //this.player.play(this._enterAudio);
                socket.write('3');

                        break;

                    case 1:
                        // it's a regular character
                        //this.player.play(this._otherKeysAudio);
                        socket.write('4');

                        break;

                    default:
                        // text pasted
                        //this.player.play(this._pasteAudio);
                        socket.write('5');

                        break;
                }
                break;
        }
    }, 100, { leading: true });

    _arrowKeysCallback = debounce((event: vscode.TextEditorSelectionChangeEvent) => {
        if (!isActive) { return; }

        // current editor
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document !== event.textEditor.document) { return; }

        // check if there is no selection
        if (editor.selection.isEmpty && isNotArrowKey === false) {
            //this.player.play(this._arrowsAudio);
            socket.write('0');
        } else {
            isNotArrowKey = false;
        }
    }, 100, { leading: true });

    dispose() {
        this._disposable.dispose();
        socket.destroy();
    }
}
