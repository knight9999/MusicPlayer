class WavGenerator {
  constructor (samplingRate, isBitRate16) {
    this.data = [];
    // this.samplingRate = 11025;
    // this.bitRate16 = false;
    this.samplingRate = samplingRate;
    this.bitRate16 = isBitRate16
  }

  genFreq (keyNum) {
    // return 440 * Math.pow(2, (keyNum - 49) / 12); // ES6
    return 440 * (2 ** ((keyNum - 49) / 12)); // ES2016
  }

  createWave (keyNum, soundLength, prevLength, postLength, vol, soundFunc) { // vol = 0.0 ... 1.0;
    let result = [];
    const muteData = this.bitRate16 ? 0 : 128;

    if (keyNum == null) {
      for (let t = 0; t < Math.floor(this.samplingRate*soundLength); t++) {
        if (this.bitRate16) {
          result.push(... this.le16(muteData) );
        } else {
          result.push(muteData);
        }
      }
      return result;
    }

    const volume =  (this.bitRate16 ? (2 ** 15 - 1) : (2 ** 7 - 1)) * vol;
    const freq = this.genFreq(keyNum);
    const phase = 2.0 * Math.PI / (this.samplingRate / freq);
    const length = Math.floor(this.samplingRate * soundLength); // 全体の長さ
    const time1 = Math.floor(this.samplingRate * prevLength); // 音の出だしまでの時間
    const time2 = Math.floor(this.samplingRate * (soundLength - postLength)); // 音が完全に鳴っているまでの時間

    for (let t = 0; t < Math.floor(length); t++) {
      const r = (t<time2) ? ((t<time1) ? (t/time1) : 1.0 ) : (1.0 - (t-time2) / (length - time2));
      let bytes = Math.floor(
        soundFunc(phase*t)*volume*r + muteData
      );
      if (this.bitRate16) {
        bytes = this.le16(bytes);
        result.push(bytes[0]);
        result.push(bytes[1]);
        // result = result.concat( this.le16(bytes) );
      } else {
        result.push(bytes);
      }
    }

    return result;
  }

  mergeWaves (waves) {
    const num = waves.length;
    let result = [];
    const maxLength = Math.max(...waves.map((wave)=>wave.length));
    const muteData = this.bitRate16 ? 0 : 128;
    if (this.bitRate16) {
      for (let i=0;i<maxLength;i=i+2) {
        const vals = waves.map((wave)=>{
          if (i+1 < wave.length) {
            const word = wave[i] + wave[i+1]*256;
            return word > 32767 ? (word - 65536) : word;
          }
          return 0;
        });
        const sum = vals.reduce((acc, v)=>{ return acc + v; });
        let naive = Math.floor( sum / num );
        naive = naive > 32767 ? 32767 : (naive < -32768 ? -32768 : naive);
        const bytes = this.le16( naive );
        result.push(bytes[0]);
        result.push(bytes[1]);
      }
    } else {
      for (let i=0;i<maxLength;i++) {
        const vals = waves.map((wave)=>{
          if (i < wave.length) {
            const word = wave[i] - muteData;
            return word;
          }
          return 0;
        });
        const sum = vals.reduce((acc, v)=>{ return acc + v; });
        let naive = Math.floor( sum / num );
        naive = naive > 127 ? 127 : (naive < -128 ? -128 : naive);
        const byte = naive + 128;
        result.push(byte);
      }

    }
    return result;
  }

  addHeader (wave) {
    // let wave = this.createWave(keyNum, note);
    let data = [];

    data.push( ...[0x52, 0x49, 0x46, 0x46] ); // 'RIFF'
    let size = 44 + wave.length;
    data.push( ...this.le32(size-8) );
    data.push( ...[0x57, 0x41, 0x56, 0x45] ); // 'WAVE'
    data.push( ...[0x66, 0x6d, 0x74, 0x20] ); // 'fmt '
    data.push( ...[0x10, 0x00, 0x00, 0x00] ); // Chunk byte
    data.push( ...[0x01, 0x00] ); // PCM format
    data.push( ...[0x01, 0x00] ); // monoral:1 stereo:2
    data.push( ...this.le32( this.samplingRate ) ); // sampling rate
    data.push( ...this.le32( this.samplingRate * 1 * (this.bitRate16 ? 2 : 1)) ); // data speed
    data.push( ...[(this.bitRate16 ? 0x02 : 0x01), 0x00] ); // block size
    data.push( ...[(this.bitRate16 ? 0x10 : 0x08), 0x00] ); // bit/sample
    data.push( ...[0x64, 0x61, 0x74, 0x61] ); // 'data'
    data.push( ...this.le32(wave.length) );
    wave.forEach((b) => { data.push(b); });
    // data.push( ...wave );
    return data;
  }

  le16 (w16) { // リトルエンディアンバイト 16bit
    return [w16 & 0xFF, (w16 >> 8) & 0xFF];
  }

  le32 (w32) { // リトルエンディアンバイト 32bit
    return [w32 & 0xFF, (w32 >> 8) & 0xFF, (w32 >> 16) & 0xFF, (w32 >> 24) & 0xFF];
  }

}
