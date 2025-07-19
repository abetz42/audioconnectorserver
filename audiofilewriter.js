const fs = require('fs');
const wavefile = require ('wavefile');


class AudioStreamWriter {
  constructor(filename, options = {}) {
    this.filename = filename;
    this.sampleRate = options.sampleRate || 44100;
    this.channels = options.channels || 1;
    this.bitsPerSample = options.bitsPerSample || 16;
    this.chunks = [];
    this.totalBytes = 0;
    this.isFinalized = false;
  }

  // Add a chunk of audio data
  addChunk(audioChunk) {
    if (this.isFinalized) {
      throw new Error('Cannot add chunks after stream is finalized');
    }

    const buffer = Buffer.isBuffer(audioChunk) ? audioChunk : Buffer.from(audioChunk);
    this.chunks.push(buffer);
    this.totalBytes += buffer.length;
  }

  // Finalize and write the complete WAV file
  finalize(conversation) {
    if (this.isFinalized) {
      throw new Error('Stream already finalized');
    }

    this.filename = conversation + '.wav';

    // Calculate derived values
    const bytesPerSample = this.bitsPerSample / 8;
    const blockAlign = this.channels * bytesPerSample;
    const byteRate = this.sampleRate * blockAlign;
    
    // Calculate sizes
    const dataSize = this.totalBytes;
    const fileSize = 36 + dataSize;
    
    // Create WAV header
    const header = Buffer.alloc(44);
    let offset = 0;
    
    // RIFF header
    header.write('RIFF', offset); offset += 4;
    header.writeUInt32LE(fileSize, offset); offset += 4;
    header.write('WAVE', offset); offset += 4;
    
    // fmt chunk
    header.write('fmt ', offset); offset += 4;
    header.writeUInt32LE(16, offset); offset += 4;
    header.writeUInt16LE(1, offset); offset += 2;
    header.writeUInt16LE(this.channels, offset); offset += 2;
    header.writeUInt32LE(this.sampleRate, offset); offset += 4;
    header.writeUInt32LE(byteRate, offset); offset += 4;
    header.writeUInt16LE(blockAlign, offset); offset += 2;
    header.writeUInt16LE(this.bitsPerSample, offset); offset += 2;
    
    // data chunk
    header.write('data', offset); offset += 4;
    header.writeUInt32LE(dataSize, offset);
    
    // Combine all data
    const audioData = Buffer.concat(this.chunks);
    const wavFile = Buffer.concat([header, audioData]);
    
    // Write to file
    fs.writeFileSync(this.filename, wavFile);
    
    this.isFinalized = true;
   // console.log(`WAV file written: ${this.filename} (${wavFile.length} bytes, ${this.chunks.length} chunks)`);

    let wav = new wavefile.WaveFile(fs.readFileSync(this.filename));
        wav.fromMuLaw();
        wav.toSampleRate(8000);
        fs.writeFileSync(this.filename,wav.toBuffer());
    

    return this.filename;
  }

  // Async version of finalize
  async finalizeAsync() {
    if (this.isFinalized) {
      throw new Error('Stream already finalized');
    }

    return new Promise((resolve, reject) => {
      try {
        const bytesPerSample = this.bitsPerSample / 8;
        const blockAlign = this.channels * bytesPerSample;
        const byteRate = this.sampleRate * blockAlign;
        
        const dataSize = this.totalBytes;
        const fileSize = 36 + dataSize;
        
        const header = Buffer.alloc(44);
        let offset = 0;
        
        // RIFF header
        header.write('RIFF', offset); offset += 4;
        header.writeUInt32LE(fileSize, offset); offset += 4;
        header.write('WAVE', offset); offset += 4;
        
        // fmt chunk
        header.write('fmt ', offset); offset += 4;
        header.writeUInt32LE(16, offset); offset += 4;
        header.writeUInt16LE(1, offset); offset += 2;
        header.writeUInt16LE(this.channels, offset); offset += 2;
        header.writeUInt32LE(this.sampleRate, offset); offset += 4;
        header.writeUInt32LE(byteRate, offset); offset += 4;
        header.writeUInt16LE(blockAlign, offset); offset += 2;
        header.writeUInt16LE(this.bitsPerSample, offset); offset += 2;
        
        // data chunk
        header.write('data', offset); offset += 4;
        header.writeUInt32LE(dataSize, offset);
        
        const audioData = Buffer.concat(this.chunks);
        const wavFile = Buffer.concat([header, audioData]);
        
        fs.writeFile(this.filename, wavFile, (err) => {
          if (err) {
            reject(err);
          } else {
            this.isFinalized = true;
            console.log(`WAV file written: ${this.filename} (${wavFile.length} bytes, ${this.chunks.length} chunks)`);
            resolve(this.filename);
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  // Get current stream info
  getInfo() {
    return {
      filename: this.filename,
      chunksReceived: this.chunks.length,
      totalBytes: this.totalBytes,
      isFinalized: this.isFinalized,
      estimatedDuration: this.totalBytes / (this.sampleRate * this.channels * (this.bitsPerSample / 8))
    };
  }

  // Reset the stream (clear all chunks)
  reset() {
    this.chunks = [];
    this.totalBytes = 0;
    this.isFinalized = false;
  }
}

module.exports = { AudioStreamWriter };