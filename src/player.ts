const cp = require('child_process');
const path = require('path');
const player = require('play-sound')();

const _isWindows = process.platform === 'win32';
const _playerWindowsPath = path.join(__dirname, '..', 'audio', 'VSCodeSoundHelper.exe');



export interface PlayerConfig {
    /**
     * Specify volume of the sounds
     */
    macVol: number;
    winVol: number;
    linuxVol: number;
}

const playerAdapter = (opts: PlayerConfig) => ({
    afplay: ['-v', opts.macVol],
    mplayer: ['-af', `volume=${opts.linuxVol}`],
});

export default {
    play(filePath: string, config: PlayerConfig) : Promise<void> {
        return new Promise ((resolve, reject) => {
            if (_isWindows) {
                console.log("hey");
                //cp.execFile(_playerWindowsPath, [filePath]);
                resolve();
            } else {
                player.play(filePath, playerAdapter(config), (err: any) => {
                if (err) {
                    console.error("Error playing sound:", filePath, " - Description:", err);
                    return reject(err);
                }
                    resolve();
                });
            }
        });
    }
};
