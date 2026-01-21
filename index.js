const {
  Client,
  GatewayIntentBits,
  Partials,
  SlashCommandBuilder,
  REST,
  Routes
} = require("discord.js");
const fs = require("fs");

// ================== CONFIG ==================
const TOKEN = process.env.TOKEN; // NÃO coloque token aqui
const BIRTHDAY_FILE = "./birthdays.json";

// Raid
const RAID_LIMIT = 5;      // pessoas
const RAID_TIME = 10000;   // 10s
let joinLog = [];

// Controle de anúncio diário
let lastAnnouncedDate = null;

// ================== CLIENT ==================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel]
});

// ================== UTILS ==================
function loadBirthdays() {
  if (!fs.existsSync(BIRTHDAY_FILE)) return {};
  return JSON.parse(fs.readFileSync(BIRTHDAY_FILE, "utf8"));
}

function saveBirthdays(data) {
  fs.writeFileSync(BIRTHDAY_FILE, JSON.stringify(data, null, 2));
}

function todayBR() {
  // retorna DD/MM
  return new Date().toLocaleDateString("pt-BR", {
    timeZone: "America/Sao_Paulo"
  }).slice(0, 5);
}

function dateKeyBR() {
  // chave do dia (YYYY-MM-DD) pra evitar spam
  return new Date().toLocaleDateString("sv-SE", {
    timeZone: "America/Sao_Paulo"
  });
}

function hourBR() {
  return Number(
    new Date().toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      hour: "2-digit",
      hour12: false
    })
  );
}

// ================== SLASH COMMANDS ==================
const commands = [
  new SlashCommandBuilder()
    .setName("registrar_aniversario")
    .setDescription("Registrar seu aniversário (DD/MM)")
    .addStringOption(o =>
      o.setName("data").setDescription("DD/MM").setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("mudar_aniversario")
    .setDescription("Mudar seu aniversário (DD/MM)")
    .addStringOption(o =>
      o.setName("data").setDescription("DD/MM").setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("retirar_aniversario")
    .setDescription("Remover seu aniversário")
].map(c => c.toJSON());

// ================== READY ==================
client.once("ready", async () => {
  console.log(`🐺 Feralis online como ${client.user.tag}`);

  // Registrar slash commands
  const rest = new REST({ version: "10" }).setToken(TOKEN);
  await rest.put(
    Routes.applicationCommands(client.user.id),
    { body: commands }
  );
  console.log("✅ Slash commands registrados");

  // Checar aniversários a cada minuto
  setInterval(() => {
    const today = todayBR();
    const key = dateKeyBR();
    const birthdays = loadBirthdays();

    if (lastAnnouncedDate === key) return;

    const aniversariantes = Object.entries(birthdays)
      .filter(([, d]) => d === today)
      .map(([id]) => `<@${id}>`);

    if (aniversariantes.length > 0) {
      client.guilds.cache.forEach(guild => {
        guild.systemChannel?.send(
          `🎉🎂 **@everyone**\nHoje é aniversário de ${aniversariantes.join(", ")} 🥳\nQue o dia seja caótico, feliz e cheio de bolo 💖🔥`
        );
      });
      lastAnnouncedDate = key;
    }
  }, 60 * 1000);
});

// ================== RAID DETECTOR ==================
client.on("guildMemberAdd", member => {
  const now = Date.now();
  joinLog.push(now);
  joinLog = joinLog.filter(t => now - t < RAID_TIME);

  if (joinLog.length >= RAID_LIMIT) {
    member.guild.systemChannel?.send(
      "🚨 **PAROOOO COM O ESCÂNDALO** 🚨\nSe continuar o @yukiketsu vai matar vcs 🔪"
    );
    joinLog = [];
  }
});

// ================== INTERACTIONS ==================
client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const birthdays = loadBirthdays();
  const uid = interaction.user.id;
  const data = interaction.options.getString("data");

  if (interaction.commandName === "registrar_aniversario") {
    birthdays[uid] = data;
    saveBirthdays(birthdays);
    return interaction.reply(`🎂 Aniversário registrado: **${data}**`);
  }

  if (interaction.commandName === "mudar_aniversario") {
    birthdays[uid] = data;
    saveBirthdays(birthdays);
    return interaction.reply(`🔁 Aniversário alterado para **${data}**`);
  }

  if (interaction.commandName === "retirar_aniversario") {
    delete birthdays[uid];
    saveBirthdays(birthdays);
    return interaction.reply("❌ Aniversário removido");
  }
});

// ================== MESSAGES ==================
client.on("messageCreate", message => {
  if (message.author.bot) return;

  // Marcar o bot
  if (message.mentions.has(client.user)) {
    message.reply("💢 **QUEM ME ACORDOU**");
  }

  // Falar ou marcar yukiketsu
  if (
    message.content.toLowerCase().includes("yukiketsu") ||
    message.mentions.users.some(u =>
      u.username.toLowerCase().includes("yukiketsu")
    )
  ) {
    message.reply("😴 deixa a passiva dormir");
  }

  // Perguntas
  if (message.content.trim().endsWith("?")) {
    const h = hourBR();
    if (h >= 0 && h < 5) {
      message.reply("vai dormir caralho, pergunta essa hora não 😡");
    } else {
      message.reply("fala com calma, tô ouvindo 😌");
    }
  }
});

client.login(MTQ2MzY2MDAxMzA0NTI4NTA3Nw.GlPeJR.HL1uVNdFOL2mAJT4abRDcjGLwE7sIidpdyNSGo);
