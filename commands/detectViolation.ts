require('dotenv').config();
import { ChannelType, Client, GatewayIntentBits, REST, SlashCommandBuilder } from "discord.js";
const { createWriteStream } = require("node:fs");
const { rename, unlink } = require("node:fs/promises");
const speech = require('@google-cloud/speech');
const client = new speech.SpeechClient();
const path = require("node:path");
const {Storage} = require('@google-cloud/storage');
const storage = new Storage();
const bucketName = 'tidb-bucket-123';
const {fromLang, violation} = require('../constants');
const {addSql} = require('../utils/addToSql');
const {getViolations} = require('../utils/checkViolation')
async function transcribe() {
  try {
    const filePath = './clips/p.mp3'; // Replace with the path to the file you want to upload in the GCS bucket

    // Upload the file to the GCS bucket
    const [uploadedFile] = await storage.bucket(bucketName).upload(filePath, {
      destination: filePath, // Use the same file name for the destination in the bucket
    });

    // Get the GCS URI of the uploaded file
    const gcsUri = `gs://${bucketName}/${filePath}`;
    console.log('File uploaded successfully.');

    // Speech-to-Text transcription configuration
    const audio = {
      uri: gcsUri,
    };
    const config = {
      encoding: 'MP3',
      sampleRateHertz: 44100,
      languageCode: fromLang,
    };
    const request = {
      audio: audio,
      config: config,
    };

    // Wait for the file to get uploaded to the Cloud bucket before starting the transcription
    await new Promise((resolve:any, reject:any) => {
      setTimeout(() => resolve(), 2000); // Wait for 5 seconds, adjust this time based on your file size and network speed
    });

    // Detects speech in the audio file
    const [response] = await client.recognize(request);
    const transcription = response.results
      .map((result:any) => result.alternatives[0].transcript)
      .join('\n');

    if (!transcription) {
        console.error('Transcription result is empty.');
        // Handle the error or return an appropriate response.
        return;
      }
      
      
    return transcription;
  } catch (error:any) {
    console.error('Error uploading file or transcribing:', error.message);
  }
}
  
const {
  joinVoiceChannel,
  getVoiceConnection,
  VoiceConnectionStatus,
  entersState,
  EndBehaviorType,
} = require("@discordjs/voice");
const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  GuildMember,
} = require("discord.js");
const { opus } = require("prism-media");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;

const startRecording = (receiver:any, userId :any) => {
  const filename = `${userId}-${Date.now()}`;
  const filepath = path.join(__dirname, '../clips', filename) + ".pcm";

  console.log(`Started recording ${filename}`);

  const pcmStream = receiver
    .subscribe(userId, {
      end: {
        behavior: EndBehaviorType.Manual,
      },
    })
    .pipe(
      new opus.Decoder({
        rate: 48000,
        channels: 2,
        frameSize: 120,
      })
    )
    .pipe(createWriteStream(filepath));

  pcmStream
    .on("error", (err:any) => console.warn(`Could not record ${filename}:`, err))
    .on("finish", () => {
      console.log(`Recorded ${filename}`);
      pcmStream.destroy();
    });

  return filepath;
};

const initRecord = (receiver:any, ids:any) => {
  const paths = ids.map((memberId:any) => startRecording(receiver, memberId));
  return paths;
};

const endRecord = async (paths:any, newPath:any, isGroup = false) => {
  if (!paths.length) {
    throw new Error("No file paths found");
  }
  if (isGroup) {
    const command = ffmpeg()
      .setFfmpegPath(ffmpegPath)
      .outputOptions("-ac 2")
      .outputOptions("-ab 96k")
      .outputOptions(
        `-filter_complex amix=inputs=${paths.length}:duration=longest:dropout_transition=2`
      )
      .format("mp3")
      .on("error", (err:any) => {
        console.log(`Error encountered while trying to merge mp3: ${err}`);
      })
      .once("end", async () => {
        console.log(`Converted ${newPath}`);
        try {
          for (const temppath of paths) {
            await unlink(temppath);
            console.log(`Deleted group recording from user @ ${temppath}`);
          }
        } catch (err) {
          console.warn("Error merging recordings:", err);
        }
      });

    for (const temppath of paths) {
      command.input(temppath).inputFormat("s32le");
    }

    return command.save(newPath);
  } else {
    return ffmpeg()
      .setFfmpegPath(ffmpegPath)
      .input(paths[0])
      .inputFormat("s32le")
      .outputOptions("-af asetrate=44100*1.1,aresample=44100")
      .outputOptions("-ac 2")
      .outputOptions("-ab 96k")
      .format("mp3")
      .on("error", (err:any) => {
        console.warn(`Error encountered while trying to convert to mp3:`, err);
      })
      .once("end", async () => {
        console.log(`Converted ${paths[0]}`);
        await unlink(paths[0]);
        await rename(paths[0].replace("pcm", "mp3"), newPath);
        console.log(`Deleted old ${paths[0]}`);
      })
      .save(paths[0].replace("pcm", "mp3"));
  }
};

export default {
  data: new SlashCommandBuilder()
    .setName("detect")
    .setDescription("Records a voice clip")
    .addStringOption((option) =>
      option
        .setName("clip")
        .setDescription("Name of the clip")
        .setRequired(true)
    )
    .addBooleanOption((option) =>
      option
        .setName("group")
        .setDescription("Whether or not to record everyone in the channel")
        .setRequired(false)
    ),
  async execute(interaction:any) {
    //createBucket();
    if (!interaction.client.ongoingRecordings) {
      interaction.client.ongoingRecordings = {};
    }

    // Check if loadedFiles object exists, if not initialize it
    if (!interaction.client.loadedFiles) {
      interaction.client.loadedFiles = {};
    }

    if (interaction.client.ongoingRecordings[interaction.member.id]) {
      return interaction.reply({
        content: "You have an ongoing recording. End that one first!",
        ephemeral: true,
      });
    }

    const clipName = interaction.options.getString("clip");

    if (interaction.client.loadedFiles[clipName]) {
      return interaction.reply({
        content: "There is already a recording with that name!",
        ephemeral: true,
      });
    }

    const member = interaction.member;
    if (!(member instanceof GuildMember && member.voice.channel)) {
      return interaction.reply({
        content: "You're not in a voice channel!",
        ephemeral: true,
      });
    }

    const isGroup = interaction.options.getBoolean("group");

    await interaction.deferReply();

    let connection = getVoiceConnection(interaction.guildId);
    if (!connection) {
      connection = joinVoiceChannel({
        channelId: member.voice.channelId,
        guildId: interaction.guildId,
        adapterCreator: interaction.guild.voiceAdapterCreator,
        selfDeaf: false,
        selfMute: false,
      });
    }

    try {
      await entersState(connection, VoiceConnectionStatus.Ready, 30_000);
    } catch (err) {
      console.warn(err);
      return interaction.followUp({
        content: `Could not connect to ${member.voice.channel.name}`,
        ephemeral: true,
      });
    }
    const receiver = connection.receiver;

    connection.once(VoiceConnectionStatus.Ready, () => {
      console.log(
        `Connection created by ${member.displayName} in ${member.guild.name} > #${member.voice.channel.name}`
      );
    });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`record:${member.id}`)
        .setLabel("Record")
        .setStyle(ButtonStyle.Primary)
        .setEmoji("🔴")
        .setDisabled(false),
      new ButtonBuilder()
        .setCustomId(`stop:${member.id}`)
        .setLabel("Stop")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true)
        .setEmoji("⏹️")
    );

    const updatedRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`record:${member.id}`)
        .setLabel("Record")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("🔴")
        .setDisabled(true),
      new ButtonBuilder()
        .setCustomId(`stop:${member.id}`)
        .setLabel("Stop")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(false)
        .setEmoji("⏹️")
    );

    const collector = interaction.channel.createMessageComponentCollector({
      filter: (i:any) => i.user.id === member.id,
      time: 60_000,
    });

    collector.on("collect", async (i:any) => {
      if (i.customId === `record:${member.id}`) {
        collector.resetTimer();
        interaction.client.ongoingRecordings[member.id] = {
          rcv: {},
          paths: [],
          clipName: clipName,
        };
        const paths = initRecord(
          receiver,
          isGroup
            ? member.voice.channel.members
                .filter((m:any) => m.user && !m.user.bot)
                .map((m:any) => m.id)
            : [member.id]
        );
        interaction.client.ongoingRecordings[member.id].paths = paths;
        await i.update({
          content:
            "Recording has started! Press the **Stop** button to end it!",
          components: [updatedRow],
          ephemeral: true,
        });
      } else if (i.customId === `stop:${member.id}`) {
        for (const id in interaction.client.ongoingRecordings[member.id].rcv) {
          interaction.client.ongoingRecordings[member.id].rcv[id].destroy();
          delete interaction.client.ongoingRecordings[member.id].rcv[id];
        }
        const { clipName, paths } =
          interaction.client.ongoingRecordings[member.id];
        const newPath = path.join(__dirname, "../clips", clipName) + ".mp3";
        try {
          await endRecord(paths, newPath, isGroup);
        } catch (err) {
          console.warn(err);
          return i.update({
            content: "😢 Recording failed. Try again later?",
            components: [],
            ephemeral: true,
          });
        }
        // Save file with clipName
        collector.stop("Recording ended");
        delete interaction.client.ongoingRecordings[member.id];
        await i.update({
          content: `👍 Recording completed! Your new clip is \`${clipName}\``,
          components: [],
          ephemeral: true,
        });
        const transcription = await transcribe();
        console.log(transcription);
        const ans = getViolations(violation, transcription);
        if(ans){
            addSql(interaction.guildId, ans.id, ans.severity, ans.tag, interaction.member.id);
        }
    }});
    
    return interaction.followUp({
      content:
        "New recording initialised! Press the **Record** button to begin recording, and **Stop** to end it!",
      components: [row],
      ephemeral: true,
    });
  },
};



