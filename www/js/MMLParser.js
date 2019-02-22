class MMLParser {
  constructor(octave = 4, volume = 0.6, tempo = 120) {
    this.default = {
      octave: octave,
      volume: volume,
      tempo: tempo
    }
  }

  reset () {
    this.octave = this.default.octave; // 4
    this.volume = this.default.volume; // 0.6;
    this.tempo = this.default.tempo; // 120;
  }

  // createWave (keyNum, t) {
  //   const soundLength = t * (60 / this.tempo);
  //   const muteLength = 0.1 * (60 / this.tempo);
  //   return this.wavMaker.createWave(keyNum, soundLength, muteLength, this.volume);
  // }

  // createBytes (mml) {
  //   return this.wavMaker.createBytes(this.parse(mml));
  // }

  parse (mml) {
    this.reset();
    let s = mml;
    let result = [];

    const mmap = {
      'C': 40,  // ド
      'D': 42,  // レ
      'E': 44,  // ミ
      'F': 45,  // ファ
      'G': 47,  // ソ
      'A': 49,  // ラ
      'B': 51   // シ
    }

    while (s.length > 0) {
      let m = s.match(/^([CDEFGAB])(\#|\+|\-)?(\d*)(\.*)/);
      if (m) {
        let keyNum = mmap[m[1]] + (this.octave - 4)*12;
        if (m[2] === '#' || m[2] === '+') {
          keyNum = keyNum + 1;
        } else if (m[2] === '-') {
          keyNum = keyNum - 1;
        }
        let t = this.calcTime(m[3]) * (60 / this.tempo);
        if (m[4]) {
          t = t * 1.5;
        }
        result.push( { key: keyNum, time: t, volume: this.volume , prevType: 0, postType: 0 } );
        s = s.substr(m[0].length);
        continue;
      }
      m = s.match(/^(R)(\d*)/);
      if (m) {
        let t = this.calcTime(m[2]) * (60 / this.tempo);
        result.push( { key: null, time: t, volume :this.volume, prevType: 0, postType: 0 } );
        s = s.substr(m[0].length);
        continue;
      }
      m = s.match(/^([<>])/);
      if (m) {
        if (m[1] === '>' && this.octave < 9) {
          this.octave = this.octave + 1;
        } else if (m[1] === '<' && this.octave > -1) {
          this.octave = this.octave - 1;
        }
        s = s.substr(m[0].length);
        continue;
      }
      m = s.match(/^O(-?\d)/);
      if (m) {
        let o = Number(m[1]);
        this.octave = o;
        s = s.substr(m[0].length);
        continue;
      }
      m = s.match(/^V(\d+)/);
      if (m) {
        const v = Number(m[1]);
        const v1 = (v > 127) ? 127 : ((v < 0) ? 0 : v)
        this.volume = v1 / 128;
        s = s.substr(m[0].length);
        continue;
      }
      m = s.match(/^T(\d+)/);
      if (m) {
        const t = Number(m[1]);
        const t1 = (t > 240) ? 240 : ((t < 1) ? 1 : t)
        this.tempo = t1;
        s = s.substr(m[0].length);
        continue;
      }
      break;
    }
    // console.log(wave.length);
    return result;
  }

  calcTime (n) {
    switch (Number(n)) {
      case 4:
        return 1;
      case 8:
        return 0.5;
      case 16:
        return 0.25;
      case 32:
        return 0.125;
      case 2:
        return 2;
      case 1:
        return 4;
      default:
        return 1;
    }
  }
}