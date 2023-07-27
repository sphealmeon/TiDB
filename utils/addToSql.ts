import mysql from 'mysql';
import fs from 'fs';

export function addSql(
  guildId: string,
  word: string,
  violationRating: string,
  violationType: string,
  userId: string
): Promise<any> {
  const connection: any = mysql.createConnection({
    host: 'gateway01.eu-central-1.prod.aws.tidbcloud.com',
    port: 4000,
    user: '2rt95zELAjuaNfs.root',
    password: '',
    database: 'TiDB',
    ssl: {
      ca: fs.readFileSync('./cacert.pem'),
    },
  });

  return new Promise((resolve, reject) => {
    connection.connect((err: any) => {
      if (err) {
        console.error('error connecting: ' + err.stack);
        reject(err);
        return;
      }

      console.log('connected as id ' + connection.threadId);

      const sql = `INSERT INTO violations(guildId, word, violationRating, violationType, userId)
                 VALUES (?, ?, ?, ?, ?)`;
      const values = [guildId, word, violationRating, violationType, userId];

      connection.query(sql, values, (err: any, result: any) => {
        if (err) {
          console.error('error executing query: ' + err.stack);
          reject(err);
          return;
        }

        connection.end();
        console.log('Record inserted successfully.');
        resolve(result);
      });
    });
  });
}
