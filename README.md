
# Cyberbot

A bot designed for the TIDB Future App Hackathon to solve both the issue of automated content moderation in discord voice channels and the language barriers that preside in a discord voice call.

# How to add to your server

1. Go to the discord developer web portal and create a discord bot 

2. Copy the token in your computer's clipboard (Choose your app -> Settings -> Bot -> Build a Bot -> Copy Token)

3. https://discordjs.guide/preparations/adding-your-bot-to-servers.html#creating-and-using-your-invite-link has a very good explaination on how to do this.

4. Clone the git repository -> Either cloning the repo in github or in VSCode or other editors.

5. Add the token to a dedicated file. In our code, we have the tokens in config.json, under 'TOKEN'.

6. Open Ubuntu terminal and run this:
   ```mysql --connect-timeout 15 -u '2rt95zELAjuaNfs.root' -h gateway01.eu-central-1.prod.aws.tidbcloud.com -P 4000 -D test --ssl-mode=VERIFY_IDENTITY --ssl-ca=/etc/ssl/certs/ca-certificates.crt -p(My Password What Is In TiDB)```

7. Open vscode terminal and run this: ```$env:GOOGLE_APPLICATION_CREDENTIALS="Absolute/Path/To/Json"``` (https://developers.google.com/workspace/guides/create-credentials) <- Follow this tutorial
   
8. In a terminal window in your code editor, run ```npm i --force```

9. In the same terminal window, run ```nodemon```

10. When running the code in discord, file has to be named p.

   
# Functionalities

- Can process all languages
- Can auto-moderate voice channels

# Language Codes List

Google Langugage Code Website -> (https://developers.google.com/admin-sdk/directory/v1/languages)
