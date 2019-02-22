class MusicPlayer {
  constructor (gen, soundF) {
    this.gen = gen;
    this.parser = new MMLParser();
    this.soundF = soundF; 
  }

  play(mmls) {
    const data = this.createBase64(mmls);
    const audio=new Audio("data:audio/wav;base64,"+data);
    audio.play();

  }

  createBase64(mmls) {
    const list = mmls.map((mml) => {
      const parsedData = this.parser.parse(mml);
      return parsedData.reduce((acc, data) => {
        this.gen.createWave(
          data.key, data.time, 0.025, 0.05, data.volume, this.soundF
        ).forEach((b) => { acc.push(b); });
        return acc;
      }, []);
    });
    console.log(list.length);
    const bytes = this.gen.addHeader( this.gen.mergeWaves(list) );
    let str = "";
    for (let i=0; i<bytes.length; i++) { str += String.fromCharCode(bytes[i]); }
    return btoa(str);
  } 
}

