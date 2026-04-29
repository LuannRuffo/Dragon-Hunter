const { Client, GatewayIntentBits, Partials, EmbedBuilder } = require('discord.js');
const cron = require('node-cron');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ],
    partials: [Partials.Message, Partials.Reaction, Partials.User],
});

const TOKEN = process.env.DISCORD_TOKEN;
const ID_CARGOS_PARA_MARCAR = ['ID_DO_CARGO_AQUI']; 
const NOME_CARGO_STAFF = 'Staff'; // Nome exato do cargo no seu servidor

const CONFIGS = {
    '1': {
        '⚔️': { nome: 'Ataque', limite: 17 },
        '🛡️': { nome: 'Defesa', limite: 4 },
        '📢': { nome: 'Caller', limite: 2 },
        '🚩': { nome: 'Bandeira', limite: 2 }
    },
    '2': {
        '⚔️': { nome: 'Ataque', limite: 21 },
        '🛡️': { nome: 'Defesa', limite: 4 },
        '📢': { nome: 'Caller', limite: 2 },
        '🚩': { nome: 'Bandeira', limite: 3 }
    }
};

let msgQuadroAtiva = null;
let agendamentoAtivo = null;

// Função centralizada de verificação de Staff
const verificarAcesso = (member) => {
    return member.permissions.has('Administrator') || member.roles.cache.some(r => r.name === NOME_CARGO_STAFF);
};

client.once('ready', () => {
    console.log(`Bot da Guild Online! Apenas o cargo "${NOME_CARGO_STAFF}" pode usar comandos.`);

    cron.schedule('0 22 * * *', async () => {
        if (msgQuadroAtiva && agendamentoAtivo) {
            await executarReset(agendamentoAtivo);
            const canal = msgQuadroAtiva.channel;
            const mencaoCargos = ID_CARGOS_PARA_MARCAR.map(id => `<@&${id}>`).join(' ');
            const aviso = await canal.send(`🔔 **RESET AUTOMÁTICO (Opção ${agendamentoAtivo})**\nChamada: ${mencaoCargos}`);
            setTimeout(() => aviso.delete().catch(() => {}), 300000);
        }
    }, { scheduled: true, timezone: "America/Sao_Paulo" });
});

async function executarReset(opcao) {
    if (!msgQuadroAtiva) return;
    const config = CONFIGS[opcao];
    await msgQuadroAtiva.reactions.removeAll();
    for (const emoji of Object.keys(config)) await msgQuadroAtiva.react(emoji);
    const novoEmbed = EmbedBuilder.from(msgQuadroAtiva.embeds[0])
        .setTitle(`⚔️ Formação de Batalha - Opção ${opcao}`)
        .setColor(opcao === '1' ? '#3498db' : '#e74c3c');
    await msgQuadroAtiva.edit({ embeds: [novoEmbed] });
}

client.on('messageCreate', async (message) => {
    if (message.author.bot) {
        if (msgQuadroAtiva && message.id !== msgQuadroAtiva.id) {
            setTimeout(() => message.delete().catch(() => {}), 60000);
        }
        return;
    }

    // Auto-delete de 1 minuto para manter o canal limpo
    setTimeout(() => message.delete().catch(() => {}), 60000);

    const args = message.content.split(' ');
    const comando = args[0].toLowerCase();
    const subComando = args[1];
    const listaComandos = ['!quadro', '!reset', '!agendar', '!clean'];

    // --- FILTRO DE SEGURANÇA: BLOQUEIA TUDO SE NÃO FOR STAFF ---
    if (listaComandos.includes(comando)) {
        if (!verificarAcesso(message.member)) {
            const erro = await message.reply(`❌ Erro: Apenas usuários com o cargo **${NOME_CARGO_STAFF}** podem gerenciar o quadro.`);
            return setTimeout(() => erro.delete().catch(() => {}), 5000);
        }
    }

    // --- COMANDOS ---

    if (comando === '!clean') {
        const mensagens = await message.channel.messages.fetch({ limit: 100 });
        const paraApagar = mensagens.filter(m => !msgQuadroAtiva || m.id !== msgQuadroAtiva.id);
        await message.channel.bulkDelete(paraApagar, true).catch(() => {});
        const confirm = await message.channel.send('🧹 Canal limpo pela Staff!');
        setTimeout(() => confirm.delete().catch(() => {}), 5000);
    }

    if (comando === '!quadro') {
        if (!CONFIGS[subComando]) return message.reply('Use `!quadro 1` ou `!quadro 2`.');
        
        const configAtual = CONFIGS[subComando];
        const embed = new EmbedBuilder()
            .setTitle(`⚔️ Formação de Batalha - Opção ${subComando}`)
            .setDescription('Painel restrito à Staff da Guild.')
            .setColor(subComando === '1' ? '#3498db' : '#e74c3c');

        msgQuadroAtiva = await message.channel.send({ embeds: [embed] });
        for (const emoji of Object.keys(configAtual)) await msgQuadroAtiva.react(emoji);

        const filter = (reaction) => Object.keys(configAtual).includes(reaction.emoji.name);
        const collector = msgQuadroAtiva.createReactionCollector({ filter, dispose: true });

        collector.on('collect', async (reaction, user) => {
            if (user.bot) return;
            const outras = msgQuadroAtiva.reactions.cache.filter(r => r.emoji.name !== reaction.emoji.name);
            for (const r of Array.from(outras.values())) {
                if (r.users.cache.has(user.id)) await r.users.remove(user.id);
            }
            atualizarQuadro(subComando);
        });

        collector.on('remove', () => atualizarQuadro(subComando));
    }

    if (comando === '!agendar' && CONFIGS[subComando]) {
        agendamentoAtivo = subComando;
        message.reply(`✅ Agendado: Reset das 22h será a **Opção ${subComando}**.`);
    }

    if (comando === '!reset' && CONFIGS[subComando]) {
        await executarReset(subComando);
    }
});

async function atualizarQuadro(opcao) {
    if (!msgQuadroAtiva) return;
    const config = CONFIGS[opcao];
    const novoEmbed = EmbedBuilder.from(msgQuadroAtiva.embeds[0]).setFields([]);
    let waitlistNomes = [];

    for (const [emoji, info] of Object.entries(config)) {
        const reaction = msgQuadroAtiva.reactions.cache.get(emoji);
        if (reaction) {
            await reaction.users.fetch();
            const membrosFull = reaction.users.cache.filter(u => !u.bot);
            const confirmados = membrosFull.first(info.limite);
            const nomes = confirmados.map(u => `• ${u.username}`).join('\n') || '*Vazio*';
            
            novoEmbed.addFields({ name: `${emoji} ${info.nome} (${confirmados.length}/${info.limite})`, value: nomes, inline: true });

            if (membrosFull.size > info.limite) {
                membrosFull.filter(u => !confirmados.includes(u)).forEach(u => waitlistNomes.push(`• ${u.username} (${info.nome})`));
            }
        }
    }
    novoEmbed.addFields({ name: `⏳ Lista de Espera`, value: waitlistNomes.join('\n') || '*Nenhum reserva*', inline: false });
    await msgQuadroAtiva.edit({ embeds: [novoEmbed] });
}

client.login(TOKEN);
