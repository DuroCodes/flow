import { ApplicationCommandOptionType, ChannelType, TextChannel } from 'discord.js';
import { SlashCommand } from '../../structures';
import { validateHex } from '../../util';

export default new SlashCommand({
  name: 'settings',
  description: 'the commands for settings!',
  memberPermission: 'Administrator',
  options: [
    {
      name: 'channel',
      description: 'set the channel for the bot to post to',
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: 'channel',
          description: 'the channel for the bot to post to (qotds go here)',
          type: ApplicationCommandOptionType.Channel,
          channel_types: [ChannelType.GuildText],
          required: true,
        },
      ],
    },
    {
      name: 'embed',
      description: 'set the embed settings for the bot',
      type: ApplicationCommandOptionType.SubcommandGroup,
      options: [
        {
          name: 'color',
          description: 'set the color of the embed',
          type: ApplicationCommandOptionType.Subcommand,
          options: [
            {
              name: 'color',
              description: 'the color of the embed',
              type: ApplicationCommandOptionType.String,
              min_length: 7,
              max_length: 7,
              required: true,
            },
          ],
        },
        {
          name: 'title',
          description: 'set the title of the embed',
          type: ApplicationCommandOptionType.Subcommand,
          options: [
            {
              name: 'text',
              description: 'the text of the title',
              type: ApplicationCommandOptionType.String,
              max_length: 256,
              required: true,
            },
          ],
        },
        {
          name: 'footer',
          description: 'set the footer of the embed',
          type: ApplicationCommandOptionType.Subcommand,
          options: [
            {
              name: 'text',
              description: 'the text of the footer',
              type: ApplicationCommandOptionType.String,
              max_length: 2048,
              required: true,
            },
          ],
        },
      ],
    },
  ],
  async run({ client, interaction, args }) {
    const subCommand = args.getSubcommand();

    switch (subCommand) {
      case 'channel': {
        const channel = args.getChannel('channel') as TextChannel;
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

        await client.prisma.guildData.update({
          where: {
            guildId: interaction.guildId!,
          },
          data: {
            channelId: channel.id,
          },
        });

        return client.embeds.success({
          interaction,
          reason: `Set channel to \`#${channel.name}\``,
        });
      }
      case 'title': {
        const title = args.getString('text')!;
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

        await client.prisma.guildData.update({
          where: {
            guildId: interaction.guildId!,
          },
          data: {
            EmbedSettings: {
              upsert: {
                create: { title },
                update: { title },
              },
            },
          },
        });

        return client.embeds.success({
          interaction,
          reason: `Set title to \`${title}\``,
        });
      }
      case 'footer': {
        const footer = args.getString('text')!;
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

        await client.prisma.guildData.update({
          where: {
            guildId: interaction.guildId!,
          },
          data: {
            EmbedSettings: {
              upsert: {
                create: { footer },
                update: { footer },
              },
            },
          },
        });

        return client.embeds.success({
          interaction,
          reason: `Set footer to \`${footer}\``,
        });
      }
      case 'color': {
        const color = args.getString('color')!;
        const isValid = validateHex(color);
        if (!isValid) {
          return client.embeds.error({
            interaction,
            reason: 'Invalid color! Please use a valid hex color. (ex: #ffffff)',
          });
        }

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

        await client.prisma.guildData.update({
          where: {
            guildId: interaction.guildId!,
          },
          data: {
            EmbedSettings: {
              upsert: {
                create: { color },
                update: { color },
              },
            },
          },
        });

        return client.embeds.success({
          interaction,
          reason: `Set color to \`${color}\``,
        });
      }
      default: {
        return client.embeds.error({ interaction, reason: 'Invalid command!' });
      }
    }
  },
});
