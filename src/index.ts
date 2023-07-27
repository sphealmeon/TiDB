require('dotenv').config();
import { ChannelType, Client, GatewayIntentBits, REST, SlashCommandBuilder } from "discord.js";
import { Bot } from "../structs/Bot";

export const bot = new Bot(
  new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildVoiceStates,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildMessageReactions,
      GatewayIntentBits.MessageContent
    ]
  })
);