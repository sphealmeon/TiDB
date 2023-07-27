const gTTS = require('gtts');// If the audio file is local

export function textToMP3(text: string, language: string, outputFilePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const speech = new gTTS(text, language);

        speech.save(outputFilePath, (err: any, result: any) => {
            if (err) {
                reject(err);
            } else {
                console.log("Text to speech converted!");
                resolve();
            }
        });
    });
}