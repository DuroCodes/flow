import {
  ApplicationCommandOptionType, ButtonBuilder, ButtonStyle, EmbedBuilder,
  ActionRowBuilder, ComponentType, ButtonInteraction, ColorResolvable,
} from 'discord.js';
import { SlashCommand } from '../../structures';

export default new SlashCommand({
  name: 'info',
  description: 'view your settings for the bot',
  memberPermission: 'Administrator',
  options: [
    {
      name: 'embed',
      description: 'view the embed settings for the bot',
      type: ApplicationCommandOptionType.Subcommand,
    },
    {
      name: 'general',
      description: 'view the general settings for the bot',
      type: ApplicationCommandOptionType.Subcommand,
    },
  ],
  async run({ client, interaction, args }) {
    const subCommand = args.getSubcommand();

    switch (subCommand) {
      case 'embed': {
        const embedSettings = await client.prisma.embedSettings.findFirst({
          where: {
            GuildData: {
              guildId: interaction.guildId!,
            },
          },
        });

        if (!embedSettings) {
          return client.embeds.error({ interaction, reason: 'No embed data found! Configure it with `/settings`' });
        }

        const embed = new EmbedBuilder()
          .setTitle(`${client.emoji.box} Embed Settings`)
          .setColor('Fuchsia')
          .setDescription('Click the `Preview` button to see the embed preview.\nYou can use `{number}` in the title or footer to display the QOTD number.');

        const component = (disabled = false) => {
          const button = new ButtonBuilder()
            .setLabel('Preview')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('🔎')
            .setCustomId('preview-button')
            .setDisabled(disabled);

          return new ActionRowBuilder<ButtonBuilder>().setComponents(button);
        };

        const message = await interaction.followUp({
          embeds: [embed],
          components: [component()],
          fetchReply: true,
        });

        const filter = (i: ButtonInteraction) => i.user.id === interaction.user.id;

        const collector = message.createMessageComponentCollector({
          componentType: ComponentType.Button, filter, time: 60000,
        });

        collector.on('collect', (i) => {
          if (i.customId === 'preview-button') {
            const embed = new EmbedBuilder()
              .setTitle(embedSettings.title)
              .setColor(embedSettings.color as ColorResolvable)
              .setDescription('This is an example QOTD. Your actual QOTD will be displayed here.')
              .setAuthor({ name: client.user?.tag!, iconURL: client.user?.displayAvatarURL()! })
              .setFooter({ text: embedSettings.footer })
              .setTimestamp();

            i.reply({ embeds: [embed], ephemeral: true });
          }
        });

        collector.on('end', () => {
          message.edit({
            embeds: [embed],
            components: [component(true)],
          });
        });

        break;
      }
      default: {
        const guildData = await client.prisma.guildData.findFirst({
          where: {
            guildId: interaction.guildId!,
          },
        });

        if (!guildData) {
          return client.embeds.error({
            interaction,
            reason: 'No data found! Run `/setup` to set up the bot.',
          });
        }

        const qotds = await client.prisma.qotd.findMany({
          where: {
            GuildData: {
              guildId: interaction.guildId!,
            },
          },
        });

        const embedSettings = await client.prisma.embedSettings.findFirst({
          where: {
            GuildData: {
              guildId: interaction.guildId!,
            },
          },
        });

        const channel = interaction.guild?.channels.cache.get(guildData.channelId)?.name;
        const reason = `**${client.emoji.information} Channel:** ${channel ? `\`#${channel}\`` : 'N/A'}\n**${client.emoji.ticket} QOTDs:** ${qotds.length || 'None'}\n**${client.emoji.box} Embed Settings:** ${embedSettings ? 'Use `/info embed` to view the full info!' : 'Not configured'}`;

        return client.embeds.success({
          interaction,
          reason,
        });
      }
    }
  },
});
