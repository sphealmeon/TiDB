const translate = require('translate-google');
const { translateFrom, translateTo } = require('../constants.ts');

export function translateTranscript(transcript: any): Promise<any> {
    console.log(transcript);
  return new Promise((resolve, reject) => {
    if (!transcript) {
      reject(new Error('The transcript is empty or undefined.'));
      return;
    }

    translate(transcript, { from: translateFrom, to: translateTo })
      .then((res: any) => {
        let translated = res;
        resolve(translated);
      })
      .catch((err: any) => {
        console.error('Translation error:', err);
        reject(err);
      });
  });
}
